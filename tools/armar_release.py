"""Arma el Release para jugar en la PC con la copia propia del juego (pedido de Charles, 02/11/2026; plan en
docs/PLAN_CARPETA_Y_FULL.md). No lleva NINGÚN archivo del juego: INSTALAR.cmd pide la carpeta de Silent Hill 4 (GOG)
y JUGAR.cmd levanta el mismo servidor local que se usa para probar (tools/servidor.mjs) en http://127.0.0.1:8130,
que lee el juego directo de esa carpeta. Node va adentro (copia del node.exe instalado), así que no hay que instalar nada.
Uso: python -I tools/armar_release.py [--version 1.0] [--node "C:/Program Files/nodejs/node.exe"]
Sale en _release/SH4web/ y _release/SH4web_v<versión>.zip.
FeniXVOID · Project Ravenlight
"""
import os, sys, shutil, zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def arg(k, d=None):
    return sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d

VERSION = arg('--version', '1.0')
NODE = arg('--node', r'C:\Program Files\nodejs\node.exe')
SALIDA = os.path.join(RAIZ, '_release', 'SH4web')

def copiar_arbol(origen, destino):
    # igual que publicar_sh4.py: fuera las carpetas que empiezan con "_" (copias viejas, pruebas) y node_modules
    for raiz, dirs, archivos in os.walk(origen):
        dirs[:] = [d for d in dirs if d != 'node_modules' and not d.startswith('_')]
        rel = os.path.relpath(raiz, origen)
        os.makedirs(os.path.join(destino, rel), exist_ok=True)
        for a in archivos:
            shutil.copy2(os.path.join(raiz, a), os.path.join(destino, rel, a))

def escribir(nombre, texto, crlf=True):
    with open(os.path.join(SALIDA, nombre), 'w', encoding='utf-8', newline='\r\n' if crlf else '\n') as f:
        f.write(texto)

INSTALAR = r'''@echo off
chcp 65001 >nul
title SH4 web - instalar
cd /d "%~dp0"
echo.
echo   SH4 web - The Room en el navegador
echo   ----------------------------------
echo   Necesitas tu copia de Silent Hill 4 para PC (la de GOG).
echo   You need your own PC copy of Silent Hill 4 (GOG).
echo.
set "CARPETA="
if exist "C:\GOG Games\Silent Hill 4\data" set "CARPETA=C:\GOG Games\Silent Hill 4"
if defined CARPETA (
  echo   Encontre el juego en / Found the game at:  %CARPETA%
  choice /c SN /m "  Usar esa carpeta? / Use that folder? (S = si/yes, N = elegir otra/choose another)"
  if errorlevel 2 set "CARPETA="
)
if not defined CARPETA (
  echo   Elegi la carpeta del juego en la ventana que se abre...
  echo   Choose the game folder in the window that opens...
  for /f "usebackq delims=" %%i in (`powershell -NoProfile -STA -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Carpeta de Silent Hill 4 (la que tiene data, demo y movie) / Silent Hill 4 folder'; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath }"`) do set "CARPETA=%%i"
)
if not defined CARPETA ( echo   No elegiste ninguna carpeta. / No folder chosen. & pause & exit /b 1 )
set "FALTA="
for %%d in (data demo) do if not exist "%CARPETA%\%%d\" set "FALTA=%%d"
if defined FALTA (
  echo.
  echo   En "%CARPETA%" no esta la carpeta "%FALTA%".
  echo   Tiene que ser la carpeta donde esta instalado el juego: adentro tienen que estar data, demo y movie.
  echo   "%CARPETA%" has no "%FALTA%" folder: pick the folder where the game is installed.
  pause & exit /b 1
)
if not exist config mkdir config
> "config\carpeta_juego.txt" echo %CARPETA%
echo   Listo / Done: %CARPETA%
powershell -NoProfile -Command "$s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\SH4 web.lnk'); $s.TargetPath = '%~dp0JUGAR.cmd'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0app\visor\icono.ico,0'; $s.Save()" >nul 2>&1
echo   Deje un acceso directo "SH4 web" en el Escritorio. / Shortcut "SH4 web" left on the Desktop.
echo.
call "%~dp0JUGAR.cmd"
'''

JUGAR = r'''@echo off
chcp 65001 >nul
title SH4 web - servidor (cerra esta ventana para apagarlo / close this window to stop it)
cd /d "%~dp0"
if not exist "config\carpeta_juego.txt" ( call "%~dp0INSTALAR.cmd" & exit /b )
set /p CARPETA=<"config\carpeta_juego.txt"
echo.
echo   SH4 web en / at:  http://127.0.0.1:8130/suite.html
echo   Juego / Game:     %CARPETA%
echo.
echo   Dejala abierta mientras jugas. Para el casco por cable: CASCO_USB.cmd
echo   Keep this window open while playing. For a headset over USB: CASCO_USB.cmd
echo.
start "" "http://127.0.0.1:8130/suite.html"
"%~dp0node\node.exe" "%~dp0app\tools\servidor.mjs" 8130 "%CARPETA%"
pause
'''

CASCO = r'''@echo off
chcp 65001 >nul
title SH4 web - casco por USB (Meta Quest / Pico)
cd /d "%~dp0"
echo.
echo   Jugar en el casco (Meta Quest o Pico) con el cable USB
echo   ------------------------------------------------------
echo   1. El casco tiene que estar en modo desarrollador y conectado por USB (acepta el permiso en el casco).
echo   2. JUGAR.cmd tiene que estar abierto en esta PC.
echo   3. Despues, en el navegador del casco abri:  http://127.0.0.1:8130/suite.html
echo.
set "ADB="
if exist "%~dp0adb\adb.exe" set "ADB=%~dp0adb\adb.exe"
if not defined ADB for %%a in (adb.exe) do if not "%%~$PATH:a"=="" set "ADB=%%~$PATH:a"
if not defined ADB (
  echo   Falta adb ^(Android Platform Tools^). Bajalo gratis de Google:
  echo   https://developer.android.com/tools/releases/platform-tools
  echo   y copia adb.exe, AdbWinApi.dll y AdbWinUsbApi.dll en la carpeta "adb" al lado de este archivo.
  echo   ^(Si tenes Meta Quest Developer Hub, ya trae adb.^)
  pause & exit /b 1
)
"%ADB%" devices
"%ADB%" reverse tcp:8130 tcp:8130 && (
  echo.
  echo   Listo: en el casco abri http://127.0.0.1:8130/suite.html
  echo   Done: open http://127.0.0.1:8130/suite.html in the headset browser
) || echo   No encontre el casco: revisa el cable y el permiso de depuracion USB en el casco.
pause
'''

LEEME = '''SH4 web — The Room en el navegador
==================================
Tributo hecho por fans, sin fines de lucro. Silent Hill es una marca de Konami.
Este paquete NO trae ningún archivo del juego: necesitás tu copia de Silent Hill 4 para PC (GOG).

CÓMO SE USA (3 pasos)
1. Descomprimí esta carpeta donde quieras.
2. Doble clic en INSTALAR.cmd y elegí la carpeta del juego (la que tiene data, demo y movie).
   Si está en C:\\GOG Games\\Silent Hill 4 la encuentra sola.
3. Se abre el navegador y listo. Las próximas veces: el acceso directo "SH4 web" del Escritorio (o JUGAR.cmd).
   La ventana negra es el servidor: dejala abierta mientras jugás.

CASCO VR (Meta Quest / Pico)
- Desde la PC: con Quest Link, Air Link o Virtual Desktop, abrí http://127.0.0.1:8130/suite.html en Chrome o Edge de la PC.
- Con el navegador del casco y el cable USB: corré CASCO_USB.cmd (necesita adb, ahí te dice cómo).
- Navegadores recomendados: Chrome o Edge en la PC; el navegador del Quest/Pico en el casco.

HOW TO USE (3 steps)
1. Unzip this folder anywhere.
2. Double-click INSTALAR.cmd and choose the game folder (the one with data, demo and movie).
3. Your browser opens and you're in. Next times: the "SH4 web" shortcut on the Desktop (or JUGAR.cmd).
   Keep the black server window open while playing.
VR: Quest Link / Air Link / Virtual Desktop with Chrome or Edge on the PC, or CASCO_USB.cmd for the headset browser over USB.

FeniXVOID · Project Ravenlight
'''

if __name__ == '__main__':
    if os.path.exists(SALIDA): shutil.rmtree(SALIDA)  # carpeta generada por este script (se rearma entera)
    os.makedirs(os.path.join(SALIDA, 'app', 'tools'))
    copiar_arbol(os.path.join(RAIZ, 'visor'), os.path.join(SALIDA, 'app', 'visor'))
    copiar_arbol(os.path.join(RAIZ, 'datos'), os.path.join(SALIDA, 'app', 'datos'))
    shutil.copy2(os.path.join(RAIZ, 'tools', 'servidor.mjs'), os.path.join(SALIDA, 'app', 'tools', 'servidor.mjs'))
    os.makedirs(os.path.join(SALIDA, 'node'))
    shutil.copy2(NODE, os.path.join(SALIDA, 'node', 'node.exe'))
    os.makedirs(os.path.join(SALIDA, 'adb'))
    escribir('INSTALAR.cmd', INSTALAR); escribir('JUGAR.cmd', JUGAR); escribir('CASCO_USB.cmd', CASCO)
    escribir('LEEME.txt', LEEME); escribir(os.path.join('adb', 'PONER_ADB_ACA.txt'), 'adb.exe, AdbWinApi.dll, AdbWinUsbApi.dll (Android Platform Tools)\n')
    zipruta = os.path.join(RAIZ, '_release', f'SH4web_v{VERSION}.zip')
    with zipfile.ZipFile(zipruta, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for raiz, _, archivos in os.walk(SALIDA):
            for a in archivos:
                p = os.path.join(raiz, a); z.write(p, os.path.join('SH4web', os.path.relpath(p, SALIDA)))
    total = sum(os.path.getsize(os.path.join(r, a)) for r, _, fs in os.walk(SALIDA) for a in fs)
    print(f'Listo: {SALIDA} ({total / 1048576:.0f} MB) y {zipruta} ({os.path.getsize(zipruta) / 1048576:.0f} MB)')
