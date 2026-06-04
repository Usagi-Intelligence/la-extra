# 🫓 Sistema de Empanadas

App de escritorio para gestionar pedidos de empanadas. Interfaz moderna, datos guardados localmente en `data.json`.

---

## ▶ Cómo ejecutar (modo desarrollo)

### 1. Instalar dependencias de Python
Necesitás Python 3.9 o superior instalado. Luego abrí una terminal en esta carpeta y ejecutá:

```bash
pip install -r requirements.txt
```

### 2. Instalar dependencias de WhatsApp (Node.js)
El sistema usa un servicio local de WhatsApp basado en **Baileys** para evitar usar Docker. Necesitás tener instalado **Node.js** en tu PC.
Abrí una terminal en la carpeta `whatsapp-service/` y ejecutá:

```bash
cd whatsapp-service
npm install
```

### 3. Correr la app
Ejecutá la app de Python:
```bash
python app_v3.py
```
*(La app de Python levantará automáticamente el servicio de WhatsApp en segundo plano en el puerto 8080)*

---

## 📦 Cómo generar el .exe para Windows

### 1. Instalar PyInstaller
```bash
pip install pyinstaller
```

### 2. Generar el ejecutable
```bash
pyinstaller --noconfirm --onefile --windowed --name "SistemaEmpanadas" app_v3.py
```

El `.exe` va a aparecer en la carpeta `dist/`.

---

## 💡 Tips

- Los datos se guardan automáticamente en `data.json` (misma carpeta que el programa).
- Para hacer backup: copiá el archivo `data.json`.
- Para empezar de cero: borrá el `data.json`.
- Si querés cambiar los precios sin abrir la app, podés editar `data.json` con el Bloc de notas.
