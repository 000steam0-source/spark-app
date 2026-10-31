@echo off
setlocal
cd /d "%~dp0"
set "LOG=%~dp0build-apk.log"
echo === Spark: build Android app (.apk) ===
echo (full log: build-apk.log)
echo build started %date% %time% > "%LOG%"

if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto havejava
set "JAVA_HOME="
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if not defined JAVA_HOME if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jre\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jre"
if not defined JAVA_HOME (echo Java not found - install Android Studio. & echo NO JAVA>>"%LOG%" & pause & exit /b 1)
:havejava
set "PATH=%JAVA_HOME%\bin;%PATH%"
if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
echo JAVA_HOME=%JAVA_HOME%>>"%LOG%"
echo ANDROID_HOME=%ANDROID_HOME%>>"%LOG%"
java -version >>"%LOG%" 2>&1
node --version >>"%LOG%" 2>&1

echo [1/5] installing dependencies...
call pnpm install --no-frozen-lockfile >>"%LOG%" 2>&1 || (echo pnpm install failed & echo FAILED install>>"%LOG%" & pause & exit /b 1)
echo [2/5] building app...
call pnpm exec vite build >>"%LOG%" 2>&1 || (echo vite build failed & echo FAILED vite>>"%LOG%" & pause & exit /b 1)
echo [3/5] preparing Android project...
if not exist "android\app\build.gradle" call pnpm exec cap add android >>"%LOG%" 2>&1
if not exist "android\app\build.gradle" (echo cap add failed & echo FAILED capadd>>"%LOG%" & pause & exit /b 1)
call pnpm exec cap sync android >>"%LOG%" 2>&1 || (echo cap sync failed & echo FAILED capsync>>"%LOG%" & pause & exit /b 1)
xcopy /s /y /q "mobile\android-res\*" "android\app\src\main\res\" >>"%LOG%" 2>&1
for /d %%D in ("android\app\src\main\res\drawable-*") do if exist "%%D\splash.png" del /q "%%D\splash.png"
copy /y "mobile\splash.png" "android\app\src\main\res\drawable\splash.png" >>"%LOG%" 2>&1
set "SDKF=%ANDROID_HOME:\=/%"
echo sdk.dir=%SDKF%> "android\local.properties"
echo [4/5] compiling APK (first run downloads Gradle, can take a while)...
pushd android
call gradlew.bat assembleDebug --no-daemon --console=plain >>"%LOG%" 2>&1 || (popd & echo gradle failed & echo FAILED gradle>>"%LOG%" & pause & exit /b 1)
popd
echo [5/5] copying APK...
if not exist release mkdir release
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "release\Spark.apk" >>"%LOG%" 2>&1 || (echo copy failed & echo FAILED copy>>"%LOG%" & pause & exit /b 1)
echo BUILD OK>>"%LOG%"
echo.
echo Done. Your APK is release\Spark.apk
timeout /t 8
