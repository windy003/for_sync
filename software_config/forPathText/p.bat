@echo off
setlocal

REM 设置 PowerShell 安装路径
set "POWERSHELL_PATH=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

REM 获取当前目录
set "CURRENT_DIR=%CD%"

REM 检查 PowerShell 是否存在
if not exist "%POWERSHELL_PATH%" (
    echo PowerShell is not found at the expected location
    pause
    exit /b 1
)

REM 启动 PowerShell 并设置工作目录
start "" "%POWERSHELL_PATH%" -NoExit -Command "Set-Location -Path '%CURRENT_DIR%'"

endlocal 