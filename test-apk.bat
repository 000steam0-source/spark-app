@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
set "LOG=%~dp0test-apk.log"
echo test started %date% %time% > "%LOG%"
if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ADB=%ANDROID_HOME%\platform-tools\adb.exe"
set "EMU=%ANDROID_HOME%\emulator\emulator.exe"
set "AVDROOT=%USERPROFILE%\.android\avd"
dir /b "%AVDROOT%" >>"%LOG%" 2>&1
dir /s /b "%ANDROID_HOME%\system-images\*system.img" >>"%LOG%" 2>&1
"%EMU%" -list-avds >>"%LOG%" 2>&1
set "AVD="
for /f "delims=" %%A in ('"%EMU%" -list-avds 2^>nul') do if not defined AVD set "AVD=%%A"
if defined AVD goto haveavd
set "IMG="
for /f "delims=" %%I in ('dir /s /b "%ANDROID_HOME%\system-images\*system.img" 2^>nul') do if not defined IMG set "IMG=%%~dpI"
if not defined IMG (echo NO SYSTEM IMAGE>>"%LOG%" & echo FAILED noimage>>"%LOG%" & exit /b 1)
set "REL=!IMG:%ANDROID_HOME%\=!"
echo image !REL!>>"%LOG%"
if not exist "%AVDROOT%" mkdir "%AVDROOT%"
mkdir "%AVDROOT%\SparkTest.avd" 2>nul
(
echo avd.ini.encoding=UTF-8
echo path=%AVDROOT%\SparkTest.avd
echo path.rel=avd\SparkTest.avd
echo target=android-36
) > "%AVDROOT%\SparkTest.ini"
(
echo avd.ini.encoding=UTF-8
echo AvdId=SparkTest
echo avd.ini.displayname=SparkTest
echo image.sysdir.1=!REL!
echo abi.type=x86_64
echo hw.cpu.arch=x86_64
echo tag.id=google_apis_playstore
echo PlayStore.enabled=true
echo hw.lcd.width=1080
echo hw.lcd.height=2400
echo hw.lcd.density=420
echo hw.ramSize=4096
echo disk.dataPartition.size=6G
echo hw.keyboard=yes
echo hw.gpu.enabled=yes
echo hw.gpu.mode=auto
echo hw.audioOutput=yes
echo showDeviceFrame=no
echo fastboot.forceColdBoot=no
) > "%AVDROOT%\SparkTest.avd\config.ini"
set "AVD=SparkTest"
:haveavd
echo using avd %AVD%>>"%LOG%"
"%ADB%" devices >>"%LOG%" 2>&1
"%ADB%" get-state 1>nul 2>nul && goto booted
start "Spark emulator" "%EMU%" -avd %AVD% -no-boot-anim -gpu auto -dns-server 8.8.8.8,1.1.1.1 -no-snapshot-load
"%ADB%" wait-for-device >>"%LOG%" 2>&1
:waitboot
set "BOOT="
for /f "delims=" %%B in ('"%ADB%" shell getprop sys.boot_completed 2^>nul') do set "BOOT=%%B"
if not "!BOOT!"=="1" (timeout /t 3 /nobreak >nul & goto waitboot)
:booted
echo booted>>"%LOG%"
"%ADB%" shell input keyevent KEYCODE_WAKEUP
"%ADB%" shell wm dismiss-keyguard
"%ADB%" shell settings put system screen_off_timeout 1800000
"%ADB%" shell svc power stayon true
"%ADB%" shell ping -c 1 www.youtube.com >>"%LOG%" 2>&1
"%ADB%" shell ping -c 1 -W 3 8.8.8.8 >>"%LOG%" 2>&1
"%ADB%" shell getprop net.dns1 >>"%LOG%" 2>&1
"%ADB%" uninstall com.spark.player >nul 2>&1
"%ADB%" install -r "release\Spark.apk" >>"%LOG%" 2>&1 || (echo FAILED install>>"%LOG%" & exit /b 1)
"%ADB%" logcat -G 16M
"%ADB%" logcat -c
"%ADB%" shell am start -n com.spark.player/.MainActivity >>"%LOG%" 2>&1
if not exist shots mkdir shots
timeout /t 15 /nobreak >nul
"%ADB%" exec-out screencap -p > "shots\emu-1.png"
timeout /t 25 /nobreak >nul
"%ADB%" exec-out screencap -p > "shots\emu-2.png"
if exist "mobile\taps.txt" for /f "usebackq tokens=1,2,3" %%a in ("mobile\taps.txt") do (
  if "%%a"=="tap" "%ADB%" shell input tap %%b %%c
  if "%%a"=="back" "%ADB%" shell input keyevent KEYCODE_BACK
  if "%%a"=="swipe" "%ADB%" shell input swipe 540 1700 540 %%b 300
  if "%%a"=="wait" timeout /t %%b /nobreak >nul
  if "%%a"=="shot" "%ADB%" exec-out screencap -p > "shots\emu-%%b.png"
)
"%ADB%" logcat -d -v brief Capacitor/Console:V AndroidRuntime:E *:S > "shots\logcat.txt" 2>&1
echo TEST DONE>>"%LOG%"
