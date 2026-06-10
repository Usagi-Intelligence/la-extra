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

        # Buscar .exe en los assets
        url_exe = next(
            (a["browser_download_url"] for a in data.get("assets", []) if a["name"].endswith(".exe")),
            None
        )
        if not url_exe:
            return False, ultima_version, None, "No se encontró ningún .exe en los assets del release."

        return True, ultima_version, url_exe, None

    except urllib.error.HTTPError as e:
        return False, None, None, f"Error HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, None, None, f"Error de red: {e.reason}"
    except Exception as e:
        return False, None, None, f"Error inesperado: {str(e)}"


def buscar_e_instalar_actualizacion(manual=False):
    """Abre el navegador en la página de releases de GitHub.
    Retorna (hubo_actualizacion, detalle).
    """
    print("Buscando actualizaciones...")
    try:
        tiene, ultima_version, url_exe, err = chequear_actualizacion()
        if err:
            raise Exception(err)
        if not tiene:
            print(f"Ya tenés la última versión ({dm.VERSION}).")
            return False, f"Al día ({dm.VERSION})"

        # Abrir navegador a la página de releases
        data_store = dm.get_data()
        config = data_store.get("config", {})
        owner = config.get("github_owner", "Usagi-Intelligence").strip()
        repo  = config.get("github_repo",  "la-extra").strip()
        releases_url = f"https://github.com/{owner}/{repo}/releases/latest"

        import webbrowser
        webbrowser.open(releases_url)
        print(f"Abriendo navegador: {releases_url}")
        return True, ultima_version

    except Exception as e:
        print(f"Error en updater: {e}")
        if manual:
            raise
        return False, str(e)

