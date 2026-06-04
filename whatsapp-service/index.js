const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { makeInMemoryStore } = require("@whiskeysockets/baileys/lib/Store/index.js");
const pino = require("pino");
const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;

// Setup logger (quiet down Baileys spam)
const logger = pino({ level: 'info' });

// Setup memory store
const store = makeInMemoryStore({ logger });
const STORE_FILE = path.join(__dirname, 'baileys_store.json');
try {
  if (fs.existsSync(STORE_FILE)) {
    store.readFromFile(STORE_FILE);
  }
} catch (e) {
  console.error("Failed to read store file:", e);
}

// Auto-save store periodically
setInterval(() => {
  try {
    store.writeToFile(STORE_FILE);
  } catch (e) {
    console.error("Failed to write store file:", e);
  }
}, 10000);

let sock = null;
let currentQr = null;
let connectionState = 'close'; // 'open', 'connecting', 'close'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));
  
  let version = [2, 3000, 1015901307]; // fallback
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
    console.log(`Fetched latest WhatsApp version: ${version.join('.')}`);
  } catch (e) {
    console.log(`Failed to fetch latest WhatsApp version, using fallback: ${version.join('.')}`);
  }

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['Chrome', 'Windows', '110.0.5481.177']
  });
  
  store.bind(sock.ev);
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      currentQr = qr;
    }
    
    if (connection) {
      connectionState = connection;
      console.log(`Connection status: ${connection}`);
    }
    
    if (connection === 'close') {
      currentQr = null;
      console.log('Last disconnect error details:', lastDisconnect?.error);
      const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      console.log(`Connection closed. Logged out: ${isLoggedOut}`);
      
      if (isLoggedOut) {
        const authDir = path.join(__dirname, 'auth_info_baileys');
        try {
          if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log('Cleared Baileys auth credentials directory on logout.');
          }
        } catch (e) {
          console.error('Failed to clear auth directory:', e);
        }
      }
      
      console.log('Reconnecting / Restarting WhatsApp socket connection...');
      connectToWhatsApp();
    } else if (connection === 'open') {
      currentQr = null;
      console.log('WhatsApp connection successfully opened!');
    }
  });
  
  sock.ev.on('messages.upsert', async (m) => {
    // Optional: could do things here if needed
  });

  sock.ev.on('messaging-history.set', ({ contacts, chats }) => {
    console.log(`  [+] Syncing history: received ${contacts?.length || 0} contacts and ${chats?.length || 0} chats.`);
  });

  sock.ev.on('contacts.upsert', (contacts) => {
    console.log(`  [+] Contact update: synced ${contacts?.length || 0} contacts.`);
  });
}

// REST API mimicking Evolution API endpoints

// 1. Connection State
app.get('/instance/connectionState/:instance', (req, res) => {
  res.json({
    instance: {
      state: connectionState === 'open' ? 'open' : (connectionState === 'connecting' ? 'connecting' : 'close')
    }
  });
});

// 2. Connect / Get QR
app.get('/instance/connect/:instance', async (req, res) => {
  if (connectionState === 'open') {
    return res.json({ message: "Already connected" });
  }
  
  if (!currentQr) {
    return res.status(404).json({ error: "QR code not generated yet. Please wait." });
  }
  
  try {
    const base64Qr = await qrcode.toDataURL(currentQr);
    res.json({ base64: base64Qr });
  } catch (e) {
    res.status(500).json({ error: "Failed to generate QR base64: " + e.message });
  }
});

// 3. Create Instance (dummy endpoint to satisfy Evolution API setup calls)
app.post('/instance/create', (req, res) => {
  res.json({ status: "SUCCESS", message: "Instance created successfully" });
});

const isRealMessage = (m) => {
  if (!m || !m.message) return false;
  return !!(
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage ||
    m.message.audioMessage ||
    m.message.videoMessage ||
    m.message.documentMessage
  );
};

// 4. Find Chats
app.post('/chat/findChats/:instance', (req, res) => {
  if (connectionState !== 'open') {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }
  
  const chatsMap = {};
  store.chats.all()
    .filter(c => {
      if (c.id.endsWith('@s.whatsapp.net')) {
        return true;
      }
      if (c.id.endsWith('@lid')) {
        const msgs = store.messages[c.id]?.array;
        return msgs && msgs.some(isRealMessage);
      }
      return false;
    })
    .forEach(c => {
      const msgs = store.messages[c.id]?.array;
      const lastMessage = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const lastIncomingMessage = msgs ? [...msgs].reverse().find(m => m.key && !m.key.fromMe && m.pushName) : null;
      const pushName = lastIncomingMessage ? lastIncomingMessage.pushName : null;
      const contact = store.contacts[c.id] || (c.pnJid ? store.contacts[c.pnJid] : null);
      
      let phoneNumber = null;
      if (c.pnJid) {
        phoneNumber = c.pnJid.split('@')[0];
      } else if (c.id && c.id.endsWith('@s.whatsapp.net')) {
        phoneNumber = c.id.split('@')[0];
      } else if (contact && contact.id && contact.id.endsWith('@s.whatsapp.net')) {
        phoneNumber = contact.id.split('@')[0];
      }
      
      const canonicalJid = c.pnJid || (c.id.endsWith('@s.whatsapp.net') ? c.id : c.id);
      
      const chatItem = {
        id: c.id,
        name: c.name || contact?.name || contact?.verifiedName || contact?.notify || pushName || null,
        phoneNumber: phoneNumber || c.id.split('@')[0],
        unreadCount: c.unreadCount || 0,
        lastMessage: lastMessage,
        canonicalJid: canonicalJid
      };
      
      const existing = chatsMap[canonicalJid];
      if (!existing) {
        chatsMap[canonicalJid] = chatItem;
      } else {
        existing.unreadCount += chatItem.unreadCount;
        
        const getTs = (item) => {
          const lm = item.lastMessage;
          if (lm && lm.messageTimestamp) {
            return Number(lm.messageTimestamp.low || lm.messageTimestamp || 0);
          }
          return 0;
        };
        
        if (getTs(chatItem) > getTs(existing)) {
          existing.id = chatItem.id;
          existing.lastMessage = chatItem.lastMessage;
        }
        if (!existing.name) {
          existing.name = chatItem.name;
        }
      }
    });

  const chats = Object.values(chatsMap);

  // Sort chats by last message timestamp descending
  chats.sort((a, b) => {
    const getTimestamp = (chat) => {
      const lm = chat.lastMessage;
      if (lm && lm.messageTimestamp) {
        return Number(lm.messageTimestamp.low || lm.messageTimestamp || 0);
      }
      return 0;
    };
    return getTimestamp(b) - getTimestamp(a);
  });
  
  res.json(chats);
});

// 5. Find Messages
app.post('/chat/findMessages/:instance', async (req, res) => {
  if (connectionState !== 'open') {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }
  
  const jid = req.body.where?.key?.remoteJid;
  const limit = req.body.limit || 50;
  
  if (!jid) {
    return res.status(400).json({ error: "Missing remoteJid in query where clause" });
  }
  
  const siblingJid = jid.endsWith('@lid') 
    ? (store.chats.all().find(c => c.id === jid)?.pnJid || null)
    : (store.chats.all().find(c => c.pnJid === jid)?.id || null);
    
  let messages = [];
  try {
    messages = await store.loadMessages(jid, limit);
  } catch (e) {
    messages = store.messages[jid]?.array || [];
  }
  
  if (siblingJid) {
    let siblingMessages = [];
    try {
      siblingMessages = await store.loadMessages(siblingJid, limit);
    } catch (e) {
      siblingMessages = store.messages[siblingJid]?.array || [];
    }
    
    const mergedMap = {};
    messages.forEach(m => { mergedMap[m.key.id] = m; });
    siblingMessages.forEach(m => { mergedMap[m.key.id] = m; });
    
    messages = Object.values(mergedMap);
  }
  
  messages.sort((a, b) => {
    const tsA = Number(a.messageTimestamp?.low || a.messageTimestamp || 0);
    const tsB = Number(b.messageTimestamp?.low || b.messageTimestamp || 0);
    return tsA - tsB;
  });
  messages = messages.slice(-limit);

  // Mark chat as read
  try {
    const jidsToClear = [jid];
    if (siblingJid) jidsToClear.push(siblingJid);
    
    jidsToClear.forEach(id => {
      const chat = store.chats.all().find(c => c.id === id);
      if (chat) chat.unreadCount = 0;
    });
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.key && !lastMessage.key.fromMe) {
      await sock.readMessages([lastMessage.key]);
    }
  } catch (e) {
    console.error("Failed to mark chat as read:", e);
  }
  
  res.json(messages);
});

// 6. Send Text Message
app.post('/message/sendText/:instance', async (req, res) => {
  if (connectionState !== 'open') {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }
  
  const { number, text } = req.body;
  if (!number || !text) {
    return res.status(400).json({ error: "Missing number or text parameters" });
  }
  
  try {
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: text });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Failed to send message: " + e.message });
  }
});

// 7. Download Media
app.post('/chat/downloadMedia/:instance', async (req, res) => {
  if (connectionState !== 'open') {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }

  const { jid, msgId, type } = req.body;
  if (!jid || !msgId || !type) {
    return res.status(400).json({ error: "Missing jid, msgId, or type parameters" });
  }

  try {
    const msgs = store.messages[jid]?.array || [];
    const message = msgs.find(m => m.key.id === msgId);
    if (!message) {
      return res.status(404).json({ error: "Message not found in store" });
    }

    const buffer = await downloadMediaMessage(
      message,
      'buffer',
      {},
      {
        logger,
        reconnector: sock,
      }
    );

    // Save directly to python's static folder
    const mediaDir = path.join(__dirname, '..', 'static', 'whatsapp_media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const ext = type === 'image' ? 'jpg' : 'ogg';
    const filename = `${msgId}.${ext}`;
    const filepath = path.join(mediaDir, filename);

    fs.writeFileSync(filepath, buffer);
    res.json({ success: true, filename: filename });
  } catch (e) {
    console.error("Failed to download media:", e);
    res.status(500).json({ error: "Failed to download media: " + e.message });
  }
});

// Start service
connectToWhatsApp().then(() => {
  app.listen(PORT, () => {
    console.log(`WhatsApp Baileys service listening on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start Baileys service:", err);
});
