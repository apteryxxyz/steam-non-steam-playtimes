import json

from helpers import json_replacer
import playtime

class RPC:
  @staticmethod
  def OnAppStart(app_name: str, instance_id: str):
    print(f"Non-steam app {app_name} launched, starting session...")
    playtime.start_session(app_name, instance_id)

  @staticmethod
  def OnAppPing(app_name: str, instance_id: str):
    playtime.ping_session(app_name, instance_id)

  @staticmethod
  def OnAppStop(app_name: str, instance_id: str):
    print(f"Non-steam app {app_name} stopped, ending session...")
    playtime.stop_session(app_name, instance_id)

  @staticmethod
  def GetPlaytimes(app_names: list[str]):
    timings = [
      playtime.get_playtime(app_name)
      for app_name in app_names
    ]
    return json.dumps(timings, default=json_replacer)

rpc = RPC()
