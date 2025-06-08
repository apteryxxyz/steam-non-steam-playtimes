import Millennium # type: ignore
import playtime
import json

#

def OnAppStart(app_name: str, instance_id: str):
  playtime.start_session(app_name, instance_id)
  print(f"Non-start app {app_name} launched, tracking playtime...")

def OnAppPing(instance_id: str):
  playtime.ping_session(instance_id)

def OnAppStop(app_name: str, instance_id: str):
  print(f"Non-stop app {app_name} stopped, tracking playtime...")
  playtime.stop_session(instance_id)

def GetPlaytime(app_name: str):
  timings = playtime.get_playtime(app_name)
  return json.dumps(timings, default=str)

#

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
