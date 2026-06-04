# 🫓 Sistema de Empanadas
App de escritorio para gestionar pedidos de empanadas. Datos guardados localmente en `data.json`.

---

## ▶ Cómo ejecutar

### 1. Python
Requiere Python 3.9+.
```bash
pip install -r requirements.txt
```

### 2. WhatsApp (Node.js)
Requiere Node.js instalado. Durante la instalación, asegurate de tildar **"Add to PATH"**. Si ya lo instalaste sin esa opción, agregalo manualmente: buscá **"Variables de entorno"** en el menú inicio → editá la variable `Path` del usuario → agregá `C:\Program Files\nodejs`.

Si al correr `npm install` PowerShell dice que la ejecución de scripts está deshabilitada, ejecutá esto una sola vez:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

```bash
cd whatsapp-service
npm install
```

### 3. Correr
```bash
python app_v3.py
```
*(Levanta automáticamente el servicio de WhatsApp en el puerto 8080)*

---

## 📦 Generar .exe

```bash
py -m PyInstaller SistemaLaExtra.spec
```
El ejecutable queda en `dist/`.

---

## 💡 Tips
- Backup: copiá `data.json`.
- Resetear datos: borrá `data.json`.
- Editar precios sin abrir la app: modificá `data.json` con el Bloc de notas.
