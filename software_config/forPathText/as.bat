@echo off
setlocal

REM Set Android Studio path (你需要根据实际安装路径修改这里)
set "ANDROID_STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe"

REM Get current directory
set "CURRENT_DIR=%CD%"

REM Check if Android Studio exists
if not exist "%ANDROID_STUDIO_PATH%" (
    echo Android Studio is not found at the expected location
    echo Please modify ANDROID_STUDIO_PATH in the script to point to your Android Studio installation
    pause
    exit /b 1
)

REM Start Android Studio and open current directory
start "" "%ANDROID_STUDIO_PATH%" "%CURRENT_DIR%"

endlocal 