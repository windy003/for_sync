#Requires AutoHotkey v2.0
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

; Ctrl+Shift+B: 在资源管理器或桌面创建新文本文档
^+b:: {
    WinClass := WinGetClass("A")

    if (WinClass == "Progman" || WinClass == "WorkerW" || WinClass == "CabinetWClass" || WinClass == "ExploreWClass") {
        if (WinClass == "Progman" || WinClass == "WorkerW") {
            CurrentPath := A_Desktop
        } else {
            CurrentPath := ""
            ClipboardBackup := ClipboardAll()
            A_Clipboard := ""

            try {
                Send("!d")
                Sleep(50)
                Send("^c")

                if ClipWait(1) {
                    CurrentPath := A_Clipboard
                }

                Send("{Escape}")
                Sleep(50)
            } catch {
            }

            A_Clipboard := ClipboardBackup

            if (CurrentPath == "") {
                try {
                    for window in ComObject("Shell.Application").Windows {
                        if (window.HWND == WinGetID("A")) {
                            CurrentPath := window.Document.Folder.Self.Path
                            break
                        }
                    }
                } catch {
                    CurrentPath := A_Desktop
                }
            }
        }

        Counter := 1
        loop {
            FileName := "新建文本文档"
            if (Counter > 1)
                FileName .= " (" . Counter . ")"
            FileName .= ".txt"

            FullPath := CurrentPath . "\" . FileName

            if (!FileExist(FullPath))
                break

            Counter++
        }

        try {
            FileAppend("", FullPath)
            ToolTip("已创建文件: " . FileName)
            SetTimer(() => ToolTip(), -2000)
        } catch Error as err {
            ToolTip("创建文件失败: " . err.message)
            SetTimer(() => ToolTip(), -3000)
        }
    }
}

; 核心映射：右 Alt → Menu 键
RAlt::AppsKey

;_________________________________________________________
; 以下热键仅在资源管理器窗口中生效

CountExplorerWindows() {
    shell := ComObject("Shell.Application")
    return shell.Windows.Count
}

#HotIf WinActive("ahk_class CabinetWClass")

; Ctrl+W: 保留最后一个资源管理器窗口
$^w:: {
    if CountExplorerWindows() <= 1 {
        ToolTip("这是最后一个资源管理器窗口，已阻止关闭`n按 Alt+F4 可强制关闭")
        SetTimer(() => ToolTip(), -2000)
        return
    }
    Suspend(true)
    Send("^w")
    Sleep(50)
    Suspend(false)
}

; Alt+F4: 关闭资源管理器窗口前弹出确认对话框
!F4:: {
    result := MsgBox("确定要关闭此资源管理器窗口吗？", "关闭确认", "OKCancel Icon?")
    if (result = "OK") {
        WinClose("A")
    }
}

; Alt+Enter: 地址栏选中状态下，在新标签页打开当前路径
!Enter:: {
    clipSaved := A_Clipboard
    A_Clipboard := ""

    Send("^a")
    Sleep(50)
    Send("^c")

    if !ClipWait(1) {
        A_Clipboard := clipSaved
        return
    }
    path := A_Clipboard

    Send("{Escape}")
    Sleep(100)

    Send("^t")
    Sleep(300)

    Send("!d")
    Sleep(150)
    A_Clipboard := path
    Send("^v")
    Sleep(50)
    Send("{Enter}")

    Sleep(100)
    A_Clipboard := clipSaved
}

#HotIf

;_________________________________________________________
; 以下热键仅在 Chrome 浏览器中生效

#HotIf WinActive("ahk_exe chrome.exe")

; Alt+F4: 关闭 Chrome 窗口前弹出确认对话框
!F4:: {
    result := MsgBox("确定要关闭 Chrome 浏览器吗？", "关闭确认", "OKCancel Icon?")
    if (result = "OK") {
        WinClose("A")
    }
}

#HotIf
