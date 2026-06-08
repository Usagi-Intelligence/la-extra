"""
updater.py - Sistema de actualización automática estilo Discord adaptado para La Extra.
"""
import urllib.request
import urllib.error
import json
import os
import sys
import subprocess
import tempfile
import zipfile
import ctypes
import data_model as dm

# Contraseña de seguridad para permitir editar la configuración desde el software.
# Modifica esta clave si deseas restringir quién puede cambiar el dueño/repositorio de GitHub.
ADMIN_PASSWORD = "umgekehrt"

def _get_paths():
    """Calcula las rutas base según si estamos en producción o desarrollo."""
    if getattr(sys, 'frozen', False):
        # Producción: SistemaLaExtra.exe está en versions/X.Y.Z/SistemaLaExtra.exe
        app_dir = os.path.dirname(sys.executable)     # versions/X.Y.Z/
        versions_dir = os.path.dirname(app_dir)        # versions/
        base_dir = os.path.dirname(versions_dir)       # raíz (donde está Launcher.exe)
    else:
        # Desarrollo: corriendo desde el código fuente
        base_dir = os.path.dirname(os.path.abspath(__file__))
        versions_dir = os.path.join(base_dir, "versions")

    return base_dir, versions_dir

def chequear_actualizacion():
    """Busca una nueva versión en GitHub sin descargarla ni instalarla.
    Retorna (tiene_actualizacion, ultima_version, url_zip, error).
    """
    data_store = dm.get_data()
    config = data_store.get("config", {})
    repo_owner = config.get("github_owner", "Usagi-Intelligence").strip()
    repo_name = config.get("github_repo", "la-extra").strip()
    version_actual = dm.VERSION

    if not repo_owner or not repo_name:
        return False, None, None, "Repositorio de GitHub no configurado en el sistema."

    url_api = f"https://api.github.com/repos/{repo_owner}/{repo_name}/releases/latest"

    try:
        req = urllib.request.Request(url_api, headers={"User-Agent": "LaExtra-Updater"})
        try:
            response = urllib.request.urlopen(req, timeout=10)
        except Exception:
            import ssl
            context = ssl._create_unverified_context()
            response = urllib.request.urlopen(req, timeout=10, context=context)

        with response:
            status_code = response.status
            if status_code != 200:
                return False, None, None, f"No se pudo consultar el repositorio (Status {status_code})"
            data = json.loads(response.read().decode("utf-8"))

        ultima_version = data.get("tag_name", "").lstrip("v")

        if not ultima_version:
            return False, None, None, "El repositorio no tiene ningún release publicado."

        # Compare version strings
        def parse_version(v):
            return tuple(int(x) for x in v.split('.')) if v else (0,)

        if parse_version(ultima_version) <= parse_version(version_actual):
            return False, ultima_version, None, None

        # Buscar el .zip en los assets del release
        url_zip = None
        for asset in data.get("assets", []):
            if asset["name"].endswith(".zip"):
                url_zip = asset["browser_download_url"]
                break

        if not url_zip:
            return False, ultima_version, None, "No se encontró ningún archivo .zip en los assets de la última versión."

        return True, ultima_version, url_zip, None

    except urllib.error.HTTPError as e:
        return False, None, None, f"Error HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, None, None, f"Error de red: {e.reason}"
    except Exception as e:
        return False, None, None, f"Error inesperado: {str(e)}"

def buscar_e_instalar_actualizacion(manual=False):
    """Busca una nueva versión en GitHub y la instala si existe.
    Retorna (need_update, details).
    """
    print("Buscando actualizaciones...")
    try:
        tiene_actualizacion, ultima_version, url_zip, err = chequear_actualizacion()
        if err:
            raise Exception(err)

        if not tiene_actualizacion:
            version_actual = dm.VERSION
            print(f"Ya tienes la última versión ({version_actual}).")
            return False, f"Al día ({version_actual})"

        print(f"Nueva versión disponible: {ultima_version}")
        _descargar_e_instalar(url_zip, ultima_version)
        return True, ultima_version

    except Exception as e:
        print(f"Error en updater: {e}")
        if manual:
            raise e
        if getattr(sys, 'frozen', False):
            ctypes.windll.user32.MessageBoxW(
                0,
                f"Error al buscar actualización:\n{str(e)}",
                "Error del Updater",
                0x10
            )
        return False, str(e)


def _descargar_e_instalar(url_zip, nueva_version):
    """Descarga el zip, extrae a versions/nueva_version/, y reinicia."""
    base_dir, versions_dir = _get_paths()
    nueva_dir = os.path.join(versions_dir, nueva_version)

    if os.path.exists(nueva_dir):
        return

    try:
        print(f"Descargando actualización {nueva_version}...")
        req = urllib.request.Request(url_zip, headers={"User-Agent": "LaExtra-Updater"})
        try:
            response = urllib.request.urlopen(req, timeout=60)
        except Exception:
            import ssl
            context = ssl._create_unverified_context()
            response = urllib.request.urlopen(req, timeout=60, context=context)

        with response:
            status_code = response.status
            if status_code != 200:
                raise Exception(f"Fallo descarga (Status {status_code})")

            zip_path = os.path.join(tempfile.gettempdir(), f"laextra_{nueva_version}.zip")

            with open(zip_path, 'wb') as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)

        print(f"Instalando versión {nueva_version}...")
        os.makedirs(nueva_dir, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall(nueva_dir)

        try:
            os.remove(zip_path)
        except OSError:
            pass

        nuevo_exe = os.path.join(nueva_dir, "SistemaLaExtra.exe")
        if not os.path.exists(nuevo_exe):
            subdirs = [d for d in os.listdir(nueva_dir)
                       if os.path.isdir(os.path.join(nueva_dir, d))]
            if subdirs:
                inner_exe = os.path.join(nueva_dir, subdirs[0], "SistemaLaExtra.exe")
                if os.path.exists(inner_exe):
                    import shutil
                    inner_dir = os.path.join(nueva_dir, subdirs[0])
                    for item in os.listdir(inner_dir):
                        shutil.move(
                            os.path.join(inner_dir, item),
                            os.path.join(nueva_dir, item)
                        )
                    shutil.rmtree(inner_dir)

        launcher_exe = os.path.join(base_dir, "Launcher.exe")
        if os.path.exists(launcher_exe):
            print("Reiniciando con la nueva versión...")
            subprocess.Popen([launcher_exe])
            os._exit(0)

    except Exception as e:
        if os.path.exists(nueva_dir):
            import shutil
            try:
                shutil.rmtree(nueva_dir)
            except OSError:
                pass
        raise e
