"""
launcher.py - Launcher mínimo para La Extra que busca la versión más reciente y la ejecuta.
"""
import os
import sys
import subprocess

def version_tuple(v):
    """Convierte '1.0.19' a (1, 0, 19) para comparación correcta."""
    try:
        return tuple(int(x) for x in v.split('.'))
    except (ValueError, AttributeError):
        return (0,)

def get_base_dir():
    """Directorio donde vive Launcher.exe."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_latest_version():
    """Busca la carpeta de versión más reciente que contenga SistemaLaExtra.exe."""
    base_dir = get_base_dir()
    versions_dir = os.path.join(base_dir, "versions")

    if not os.path.exists(versions_dir):
        return None

    carpetas = []
    for nombre in os.listdir(versions_dir):
        ruta = os.path.join(versions_dir, nombre)
        exe = os.path.join(ruta, "SistemaLaExtra.exe")

        if os.path.isdir(ruta) and os.path.exists(exe):
            carpetas.append((version_tuple(nombre), nombre, exe))

    if not carpetas:
        return None

    carpetas.sort(reverse=True)
    return carpetas[0][2]  # retorna la ruta al exe

def main():
    exe_path = get_latest_version()

    if exe_path:
        subprocess.Popen([exe_path])
    else:
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                0,
                "No se encontró ninguna versión instalada.\n"
                "Por favor, reinstale el programa.",
                "Error - Sistema La Extra",
                0x10
            )
        except Exception:
            print("Error: No se encontró ninguna versión instalada.")

if __name__ == "__main__":
    main()
