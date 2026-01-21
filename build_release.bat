@echo off
REM Build CorePlugin.exe in Release configuration
REM This script calls the build script in CorePlugin folder

cd /d "%~dp0CorePlugin"
call build_release.bat
