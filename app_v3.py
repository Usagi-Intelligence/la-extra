"""
Flask application for La Extra web interface — V3 MODERN / RETRO GLOSSY UI.
Run with: py app_v3.py
"""
import os
import sys
import time
import threading
import subprocess
import webbrowser
from flask import Flask, render_template, send_from_directory  # pyrefly: ignore[missing-import]
from api import api  # pyrefly: ignore[missing-import]

# PyInstaller compatibility for static and templates paths
if getattr(sys, "frozen", False):
    template_folder = os.path.join(sys._MEIPASS, "templates")
    static_folder = os.path.join(sys._MEIPASS, "static")
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True
app.register_blueprint(api)

whatsapp_process = None
last_heartbeat = time.time()
has_received_heartbeat = False

@app.route("/api/heartbeat", methods=["POST"])
def heartbeat_endpoint():
    global last_heartbeat, has_received_heartbeat
    last_heartbeat = time.time()
    has_received_heartbeat = True
    return "", 204

def monitor_heartbeat():
    global last_heartbeat, has_received_heartbeat, whatsapp_process
    # Wait for the browser to launch and load the page
    time.sleep(15)
    while True:
        time.sleep(2)
        if has_received_heartbeat and (time.time() - last_heartbeat > 90.0):
            print("  [!] No heartbeat received. Exiting...")
            if whatsapp_process:
                try:
                    import platform
                    if platform.system().lower() == "windows":
                        subprocess.run(["taskkill", "/F", "/T", "/PID", str(whatsapp_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        whatsapp_process.terminate()
                except Exception:
                    pass
            os._exit(0)


@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/")
def index():
    # Serves the new modern/retro glossy UI variant on the main path
    return render_template("index_v3.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, "static", "img"), "logo.png")


@app.route("/static/img/<path:filename>")
def serve_img(filename):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    img_dir = os.path.join(root_dir, "static", "img")
    return send_from_directory(img_dir, filename)


def open_app_window(url):
    import platform
    current_os = platform.system().lower()
    
    if current_os == "windows":
        # Try Edge (standard on Windows)
        edge_paths = [
            os.path.join(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"), "Microsoft\\Edge\\Application\\msedge.exe"),
            os.path.join(os.environ.get("ProgramFiles", "C:\\Program Files"), "Microsoft\\Edge\\Application\\msedge.exe"),
        ]
        for path in edge_paths:
            if os.path.exists(path):
                subprocess.Popen([path, f"--app={url}"])
                return True
                
        # Try Chrome
        chrome_paths = [
            os.path.join(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"), "Google\\Chrome\\Application\\chrome.exe"),
            os.path.join(os.environ.get("ProgramFiles", "C:\\Program Files"), "Google\\Chrome\\Application\\chrome.exe"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google\\Chrome\\Application\\chrome.exe"),
        ]
        for path in chrome_paths:
            if os.path.exists(path):
                subprocess.Popen([path, f"--app={url}"])
                return True
                
    elif current_os == "darwin":  # macOS
        # Try Chrome on macOS
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.exists(chrome_path):
            subprocess.Popen([chrome_path, f"--app={url}"])
            return True
            
        # Try Edge on macOS
        edge_path = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
        if os.path.exists(edge_path):
            subprocess.Popen([edge_path, f"--app={url}"])
            return True
            
        # Fallback to macOS open command (opens default browser, e.g. Safari)
        subprocess.Popen(["open", url])
        return True

    # Fallback to default browser
    webbrowser.open(url)
    return False


def check_port_open(port):
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.0)
    try:
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except Exception:
        return False


def start_whatsapp_service():
    if check_port_open(8080):
        print("  [*] WhatsApp service already running on port 8080.")
        return
        
    print("  [*] Starting WhatsApp companion service...")
    import subprocess
    import platform
    current_os = platform.system().lower()
    
    if getattr(sys, "frozen", False):
        service_dir = os.path.join(sys._MEIPASS, "whatsapp-service")
    else:
        service_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whatsapp-service")
        
    index_path = os.path.join(service_dir, "index.js")
    
    if not os.path.exists(index_path):
        print("  [!] WhatsApp service index.js not found.")
        return
        
    try:
        creationflags = 0
        if current_os == "windows":
            # DETACHED_PROCESS = 0x00000008, CREATE_NEW_PROCESS_GROUP = 0x00000200
            creationflags = 0x00000008 | 0x00000200
            
        global whatsapp_process
        whatsapp_process = subprocess.Popen(
            ["node", "index.js"],
            cwd=service_dir,
            creationflags=creationflags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("  [+] WhatsApp service started in background.")
    except Exception as e:
        print(f"  [!] Failed to start WhatsApp service: {e}")
        print("  [!] Make sure Node.js is installed and 'node' is in your PATH.")


if __name__ == "__main__":
    port = 5002
    
    if check_port_open(port):
        print(f"  [*] App already running on port {port}. Opening new window...")
        open_app_window(f"http://localhost:{port}")
        sys.exit(0)
        
    if getattr(sys, "frozen", False):
        root = sys._MEIPASS
    else:
        root = os.path.dirname(os.path.abspath(__file__))
        
    img_dir = os.path.join(root, "static", "img")
    os.makedirs(img_dir, exist_ok=True)
    logo_src = os.path.join(root, "logo.png")
    logo_dst = os.path.join(img_dir, "logo.png")
    if os.path.exists(logo_src) and not os.path.exists(logo_dst):
        import shutil
        shutil.copy2(logo_src, logo_dst)

    # Clean WhatsApp media if config auto_limpiar_media is enabled
    try:
        import data_model as dm
        config = dm.get_data().get("config", {})
        if config.get("auto_limpiar_media", False):
            media_dir = os.path.join(root, "static", "whatsapp_media")
            if os.path.exists(media_dir):
                import shutil
                for filename in os.listdir(media_dir):
                    file_path = os.path.join(media_dir, filename)
                    try:
                        if os.path.isfile(file_path) or os.path.islink(file_path):
                            os.unlink(file_path)
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                    except Exception:
                        pass
                print("  [+] WhatsApp media files auto-cleared on startup.")
    except Exception as e:
        print(f"  [!] Failed to auto-clear WhatsApp media on startup: {e}")

    print(f"\n  [*] La Extra - Sistema de Gestion [V3 MODERN / RETRO GLOSS]")
    print(f"  [>] http://localhost:{port}")
    print(f"  [x] Ctrl+C para detener\n")
    
    # Start WhatsApp companion service in background thread
    threading.Thread(target=start_whatsapp_service, daemon=True).start()
    
    # Start heartbeat monitor thread
    threading.Thread(target=monitor_heartbeat, daemon=True).start()
    
    # Launch browser window in background thread after 1 sec delay
    threading.Thread(target=lambda: (time.sleep(1.0), open_app_window(f"http://localhost:{port}")), daemon=True).start()
    
    app.run(debug=False, port=port, use_reloader=False)
