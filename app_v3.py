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



@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/")
def index():
    import data_model as dm
    # Serves the new modern/retro glossy UI variant on the main path
    return render_template("index_v3.html", version=dm.VERSION)


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.root_path, "logo.ico")


@app.route("/static/img/<path:filename>")
def serve_img(filename):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    img_dir = os.path.join(root_dir, "static", "img")
    return send_from_directory(img_dir, filename)


def open_app_window(url):
    import webbrowser
    webbrowser.open(url)
    return True


last_heartbeat = time.time()


@app.route("/api/heartbeat", methods=["POST"])
def heartbeat():
    global last_heartbeat
    last_heartbeat = time.time()
    return {"status": "ok"}


def monitor_heartbeat():
    global last_heartbeat
    # 15 seconds initial grace period
    time.sleep(15.0)
    while True:
        time.sleep(2.0)
        if time.time() - last_heartbeat > 10.0:
            print("  [!] No heartbeat detected. Shutting down server...")
            os._exit(0)


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

    print(f"\n  [*] La Extra - Sistema de Gestion [V3 MODERN / RETRO GLOSS]")
    print(f"  [>] http://localhost:{port}")
    print(f"  [x] Ctrl+C para detener\n")
    
    # Launch browser window in background thread after 1 sec delay
    threading.Thread(target=lambda: (time.sleep(1.0), open_app_window(f"http://localhost:{port}")), daemon=True).start()
    
    # Start heartbeat monitor thread for auto-shutdown when browser closes
    threading.Thread(target=monitor_heartbeat, daemon=True).start()
    
    app.run(debug=False, port=port, use_reloader=False)
