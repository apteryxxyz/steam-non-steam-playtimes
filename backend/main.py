import Millennium # type: ignore
import playtime_sessions as playtime
import json
import helpers

# ===== RPC ===== #

def OnAppStart(app_name: str, instance_id: str):
  playtime.start_session(app_name, instance_id)
  print(f"Non-steam app {app_name} launched, starting session...")

def OnAppPing(app_name: str, instance_id: str):
  playtime.ping_session(app_name, instance_id)

def OnAppStop(app_name: str, instance_id: str):
  print(f"Non-steam app {app_name} stopped, ending session...")
  playtime.stop_session(app_name, instance_id)

def GetPlaytime(app_name: str):
  timings = playtime.get_playtime(app_name)
  return json.dumps(timings, default=helpers.json_dumps_stringify)

# ===== Plugin ===== #

class Plugin:
  def _front_end_loaded(self):
    print("Frontend has loaded, now ready to track playtime...")
    pass
  
  def _load(self):
    playtime.load_sessions()
    Millennium.ready()
    print("Backend loaded, waiting for frontend...")
    pass

  def _unload(self):
    playtime.save_sessions()
    pass
