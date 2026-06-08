"""
updater.py - Actualización automática para La Extra (single-exe).
Descarga el zip del release, extrae SistemaLaExtra.exe, y usa un .bat
auxiliar para reemplazar el exe mientras la app está cerrada.
"""
import urllib.request
import urllib.error
import json
import os
import sys
import subprocess
import tempfile
import zipfile
import data_model as dm

# Contraseña de seguridad para permitir editar la configuración desde el software.
ADMIN_PASSWORD = "umgekehrt"


def _urlopen(req, timeout=10):
    """Abre una URL con fallback SSL."""
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except Exception:
        import ssl
        ctx = ssl._create_unverified_context()
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)


def chequear_actualizacion():
    """Busca la última versión en GitHub.
    Retorna (tiene_actualizacion, ultima_version, url_zip, error).
    """
    data_store = dm.get_data()
    config = data_store.get("config", {})
    repo_owner = config.get("github_owner", "Usagi-Intelligence").strip()
    repo_name  = config.get("github_repo",  "la-extra").strip()
    version_actual = dm.VERSION

    if not repo_owner or not repo_name:
        return False, None, None, "Repositorio de GitHub no configurado."

    url_api = f"https://api.github.com/repos/{repo_owner}/{repo_name}/releases/latest"

    try:
        req = urllib.request.Request(url_api, headers={"User-Agent": "LaExtra-Updater"})
        with _urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                return False, None, None, f"Error consultando repositorio (Status {resp.status})"
            data = json.loads(resp.read().decode("utf-8"))

        ultima_version = data.get("tag_name", "").lstrip("v")
        if not ultima_version:
            return False, None, None, "El repositorio no tiene releases publicados."

        def _v(s):
            try:
                return tuple(int(x) for x in s.split("."))
            except Exception:
                return (0,)

        if _v(ultima_version) <= _v(version_actual):
            return False, ultima_version, None, None

        # Buscar .zip en los assets
        url_zip = next(
            (a["browser_download_url"] for a in data.get("assets", []) if a["name"].endswith(".zip")),
            None
        )
        if not url_zip:
            return False, ultima_version, None, "No se encontró ningún .zip en los assets del release."

        return True, ultima_version, url_zip, None

    except urllib.error.HTTPError as e:
        return False, None, None, f"Error HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, None, None, f"Error de red: {e.reason}"
    except Exception as e:
        return False, None, None, f"Error inesperado: {str(e)}"


def buscar_e_instalar_actualizacion(manual=False):
    """Descarga e instala la actualización si existe.
    Retorna (hubo_actualizacion, detalle).
    """
    print("Buscando actualizaciones...")
    try:
        tiene, ultima_version, url_zip, err = chequear_actualizacion()
        if err:
            raise Exception(err)
        if not tiene:
            print(f"Ya tenés la última versión ({dm.VERSION}).")
            return False, f"Al día ({dm.VERSION})"

        print(f"Nueva versión disponible: {ultima_version}")
        _descargar_e_instalar(url_zip, ultima_version)
        return True, ultima_version

    except Exception as e:
        print(f"Error en updater: {e}")
        if manual:
            raise
        return False, str(e)


def _descargar_e_instalar(url_zip, nueva_version):
    """Descarga el zip, extrae el nuevo exe y lanza un .bat que hace el reemplazo."""
    tmp = tempfile.gettempdir()
    zip_path = os.path.join(tmp, f"laextra_{nueva_version}.zip")
    nuevo_exe_tmp = os.path.join(tmp, f"SistemaLaExtra_{nueva_version}.exe")

    # ── 1. Descargar ──────────────────────────────────────────────────────────
    print(f"Descargando {nueva_version}...")
    req = urllib.request.Request(url_zip, headers={"User-Agent": "LaExtra-Updater"})
    with _urlopen(req, timeout=120) as resp:
        if resp.status != 200:
            raise Exception(f"Fallo descarga (Status {resp.status})")
        with open(zip_path, "wb") as f:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                f.write(chunk)

    # ── 2. Extraer SistemaLaExtra.exe del zip ────────────────────────────────
    print("Extrayendo...")
    with zipfile.ZipFile(zip_path, "r") as z:
        # Buscar el exe dentro del zip (puede estar en raíz o subcarpeta)
        exe_entry = next(
            (n for n in z.namelist() if n.endswith("SistemaLaExtra.exe")),
            None
        )
        if not exe_entry:
            raise Exception("No se encontró SistemaLaExtra.exe dentro del zip.")
        with z.open(exe_entry) as src, open(nuevo_exe_tmp, "wb") as dst:
            while True:
                chunk = src.read(65536)
                if not chunk:
                    break
                dst.write(chunk)

    try:
        os.remove(zip_path)
    except OSError:
        pass

    # ── 3. Si estamos en el exe, lanzar .bat de reemplazo y salir ────────────
    if getattr(sys, "frozen", False):
        exe_actual = sys.executable
        bat_path = os.path.join(tmp, "laextra_update.bat")

        # El .bat espera que el proceso termine, reemplaza el exe y lo relanza
        bat_content = f"""@echo off
ping 127.0.0.1 -n 3 > nul
move /Y "{nuevo_exe_tmp}" "{exe_actual}"
start "" "{exe_actual}"
del "%~f0"
"""
        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)

        subprocess.Popen(
            ["cmd.exe", "/c", bat_path],
            creationflags=subprocess.CREATE_NO_WINDOW,
            close_fds=True
        )
        print("Reiniciando con la nueva versión...")
        os._exit(0)
    else:
        # Modo desarrollo: solo avisar, no hace nada
        print(f"[DEV] Nuevo exe listo en: {nuevo_exe_tmp}")
        print("[DEV] En producción reemplazaría el exe y reiniciaría.")
