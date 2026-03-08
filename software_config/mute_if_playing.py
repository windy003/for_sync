"""
mute_if_playing.py
如果 Windows 11 PC 当前有音频在播放，则将其静音。
依赖: pip install pycaw comtypes
"""

from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume, AudioSession
import sys


def is_audio_playing() -> bool:
    """检测是否有音频会话正在播放。"""
    sessions = AudioUtilities.GetAllSessions()
    for session in sessions:
        # session.State: 0=Inactive, 1=Active, 2=Expired
        if session.State == 1:
            return True
    return False


def mute_master_volume():
    """静音系统主音量。"""
    devices = AudioUtilities.GetSpeakers()
    interface = devices._dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = interface.QueryInterface(IAudioEndpointVolume)
    volume.SetMute(1, None)
    print("已静音。")


def main():
    if is_audio_playing():
        print("检测到音频正在播放，正在静音...")
        mute_master_volume()
    else:
        print("当前没有音频在播放，无需静音。")


if __name__ == "__main__":
    main()
