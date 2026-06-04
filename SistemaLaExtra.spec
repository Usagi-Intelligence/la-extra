# -*- mode: python ; coding: utf-8 -*-
import os

def get_whatsapp_datas():
    datas = []
    base_dir = 'whatsapp-service'
    if not os.path.exists(base_dir):
        return datas
    for root, dirs, files in os.walk(base_dir):
        if 'auth_info_baileys' in root:
            continue
        for file in files:
            if file == 'baileys_store.json':
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(root, base_dir)
            dest_dir = os.path.join('whatsapp-service', rel_path) if rel_path != '.' else 'whatsapp-service'
            datas.append((full_path, dest_dir))
    return datas

whatsapp_datas = get_whatsapp_datas()
all_datas = [('templates', 'templates'), ('static', 'static'), ('data.json', '.')] + whatsapp_datas

a = Analysis(
    ['app_v3.py'],
    pathex=[],
    binaries=[],
    datas=all_datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SistemaLaExtra',
    icon='logo.ico',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
