from functools import wraps
import json
from operator import itemgetter
from typing import Callable

from helpers import json_replacer, json_reviver
import playtime


def rpcmethod(func: Callable):
  args_names = func.__code__.co_varnames[:func.__code__.co_argcount]
  @wraps(func)
  def wrapper_func(payload: str):
    data = json.loads(payload, object_hook=json_reviver)
    args = itemgetter(*args_names)(data)
    ret = func(*args) if isinstance(args, tuple) else func(args)
    if ret: return json.dumps(ret, default=json_replacer)
  return wrapper_func


class RPC:
  @staticmethod
  @rpcmethod
  def OnAppStart(app_name: str, instance_id: str):
    print(f"Non-steam app {app_name} launched, starting session...")
    playtime.start_session(app_name, instance_id)

  @staticmethod
  @rpcmethod
  def OnAppPing(app_name: str, instance_id: str):
    playtime.ping_session(app_name, instance_id)

  @staticmethod
  @rpcmethod
  def OnAppStop(app_name: str, instance_id: str):
    print(f"Non-steam app {app_name} stopped, ending session...")
    playtime.stop_session(app_name, instance_id)

  @staticmethod
  @rpcmethod
  def GetPlaytimes(app_names: list[str]):
    return [
      playtime.get_playtime(app_name)
      for app_name in app_names
    ]

rpc = RPC()
