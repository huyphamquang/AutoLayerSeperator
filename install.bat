@echo off
REM Script cài đặt AutoLayerSeperator plugin cho Adobe Photoshop
REM Chạy script này với quyền Administrator (Right-click > Run as administrator)

echo ========================================
echo AutoLayerSeperator Plugin Installer
echo ========================================
echo.

REM Kiểm tra PowerShell có sẵn không
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell không được tìm thấy!
    echo Vui lòng cài đặt PowerShell hoặc sử dụng install.ps1 trực tiếp.
    pause
    exit /b 1
)

REM Chạy script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0install.ps1"

pause
