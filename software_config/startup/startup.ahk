#SingleInstance Force
SetWorkingDir A_ScriptDir

; Win+E: 在现有窗口创建新标签，或打开新窗口
#e:: {
    explorerHwnd := WinExist("ahk_class CabinetWClass")
    if (explorerHwnd) {
        WinActivate("ahk_id " explorerHwnd)
        Sleep(100)
        Send("^t")
    } else {
        Run("explorer.exe")
    }
}

; Ctrl+PgUp: 切换到左边的标签
^PgUp:: {
    activeHwnd := WinGetID("A")
    activeClass := WinGetClass("ahk_id " activeHwnd)
    if (activeClass = "CabinetWClass") {
        Send("^+{Tab}")
    } else {
        Send("^{PgUp}")
    }
}

; Ctrl+PgDn: 切换到右边的标签
^PgDn:: {
    activeHwnd := WinGetID("A")
    activeClass := WinGetClass("ahk_id " activeHwnd)
    if (activeClass = "CabinetWClass") {
        Send("^{Tab}")
    } else {
        Send("^{PgDn}")
    }
}


;________________________________________________________________________

#Requires AutoHotkey v2.0
#SingleInstance Force

; Ctrl+Shift+B hotkey
^+b:: {
    ; Get the current active window
    WinClass := WinGetClass("A")

    ; Check if current window is Desktop or Explorer
    if (WinClass == "Progman" || WinClass == "WorkerW" || WinClass == "CabinetWClass" || WinClass == "ExploreWClass") {
        ; Get current directory path
        if (WinClass == "Progman" || WinClass == "WorkerW") {
            ; Desktop
            CurrentPath := A_Desktop
        } else {
            ; Explorer window - use address bar method for Win11 tab support
            CurrentPath := ""

            ; Save current clipboard
            ClipboardBackup := ClipboardAll()
            A_Clipboard := ""

            try {
                ; Focus address bar and copy path
                Send("!d")  ; Alt+D to focus address bar
                Sleep(50)   ; Wait for address bar to be selected
                Send("^c")  ; Copy the path

                ; Wait for clipboard to contain text
                if ClipWait(1) {
                    CurrentPath := A_Clipboard
                }

                ; Restore focus to file list
                Send("{Escape}")
                Sleep(50)
            } catch {
                ; Ignore errors
            }

            ; Restore original clipboard
            A_Clipboard := ClipboardBackup

            ; Fallback to Shell.Application if address bar method failed
            if (CurrentPath == "") {
                try {
                    for window in ComObject("Shell.Application").Windows {
                        if (window.HWND == WinGetID("A")) {
                            CurrentPath := window.Document.Folder.Self.Path
                            break
                        }
                    }
                } catch {
                    ; Final fallback to desktop
                    CurrentPath := A_Desktop
                }
            }
        }

        ; Generate unique filename
        Counter := 1
        loop {
            FileName := "新建文本文档"
            if (Counter > 1)
                FileName .= " (" . Counter . ")"
            FileName .= ".txt"

            FullPath := CurrentPath . "\" . FileName

            ; Check if file exists
            if (!FileExist(FullPath))
                break

            Counter++
        }

        ; Create the text file
        try {
            FileAppend("", FullPath)

            ; Show success message
            ToolTip("已创建文件: " . FileName)
            SetTimer(() => ToolTip(), -2000)
        } catch Error as err {
            ; Show error message
            ToolTip("创建文件失败: " . err.message)
            SetTimer(() => ToolTip(), -3000)
        }
    }
}



