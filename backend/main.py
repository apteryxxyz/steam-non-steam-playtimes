import Millennium # type: ignore

from rpc import *
import playtime

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
