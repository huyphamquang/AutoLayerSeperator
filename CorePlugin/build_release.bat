@echo off
REM Build CorePlugin.exe in Release configuration
REM This script builds the CorePlugin project using MSBuild

setlocal enabledelayedexpansion

echo ========================================
echo Building CorePlugin.exe (Release)
echo ========================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Try to find MSBuild.exe
set MSBUILD_PATH=

REM Try Visual Studio 2022
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try Visual Studio 2022 Professional
if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try Visual Studio 2022 Enterprise
if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try Visual Studio 2019
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try Visual Studio 2019 Professional
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try .NET Framework MSBuild
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\MSBuild\15.0\Bin\MSBuild.exe" (
    set MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\MSBuild\15.0\Bin\MSBuild.exe
    goto :found_msbuild
)

REM Try to use MSBuild from PATH
where msbuild.exe >nul 2>&1
if %ERRORLEVEL% == 0 (
    set MSBUILD_PATH=msbuild.exe
    goto :found_msbuild
)

echo ERROR: MSBuild.exe not found!
echo Please install Visual Studio Build Tools or ensure MSBuild is in your PATH.
echo.
pause
exit /b 1

:found_msbuild
echo Found MSBuild at: %MSBUILD_PATH%
echo.

REM Clean previous build
echo Cleaning previous build...
"%MSBUILD_PATH%" CorePlugin.sln /t:Clean /p:Configuration=Release /p:Platform="Any CPU" /v:minimal
if %ERRORLEVEL% neq 0 (
    echo WARNING: Clean failed, continuing anyway...
)
echo.

REM Build Release configuration
echo Building Release configuration...
"%MSBUILD_PATH%" CorePlugin.sln /t:Build /p:Configuration=Release /p:Platform="Any CPU" /v:minimal /m
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Output file location:
if exist "bin\Release\CorePlugin.exe" (
    echo   bin\Release\CorePlugin.exe
    echo.
    echo File size:
    for %%A in ("bin\Release\CorePlugin.exe") do echo   %%~zA bytes
) else (
    echo   ERROR: CorePlugin.exe not found in bin\Release\
)
echo.
pause
