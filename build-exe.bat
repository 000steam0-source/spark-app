@echo off
setlocal
cd /d "%~dp0"
echo === Spark: build Windows installer (.exe) ===
echo (full log: build.log)
echo build started %date% %time% > build.log
where node >nul 2>nul || (echo Node.js 20+ is required. Install it from https://nodejs.org and run this again. & echo NO NODE>>build.log & pause & exit /b 1)
where pnpm >nul 2>nul || (call npm install -g pnpm >>build.log 2>&1 || (echo Could not install pnpm & pause & exit /b 1))
echo [1/4] installing dependencies...
call pnpm install --no-frozen-lockfile >>build.log 2>&1 || (echo pnpm install failed - see build.log & echo FAILED install>>build.log & pause & exit /b 1)
echo [2/4] native addon (optional)...
call pnpm native:build >>build.log 2>&1 || echo Native addon skipped - the app falls back to the plain window preview.
echo [3/4] building app...
call pnpm exec vite build >>build.log 2>&1 || (echo vite build failed - see build.log & echo FAILED vite>>build.log & pause & exit /b 1)
echo [4/4] packaging installer...
call pnpm exec electron-builder --win --publish never >>build.log 2>&1 || (echo electron-builder failed - see build.log & echo FAILED builder>>build.log & pause & exit /b 1)
echo BUILD OK>>build.log
echo.
echo Done. Your installer is in the "release" folder (Spark-Setup-*.exe).
timeout /t 8
