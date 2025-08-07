from pathlib import Path
from datetime import datetime, timezone, timedelta
import json
from typing import TypedDict, NotRequired
import tempfile
import os

from helpers import json_replacer, json_reviver
from __main__ import PLUGIN_BASE_DIR

#

SESSIONS_PATH = Path(PLUGIN_BASE_DIR) / "sessions.json"

# We use app name as index due to app id for non-steam games being arbitrary
class Session(TypedDict):
  instance_id: NotRequired[str]
  started_at: datetime
  ended_at: datetime

_sessions: dict[str, list[Session]] = {}

def load_sessions():
  global _sessions
  if SESSIONS_PATH.exists():
    try:
      with open(SESSIONS_PATH, "r") as f:
        _sessions = json.load(f, object_hook=json_reviver)
    except json.JSONDecodeError:
      # Create a backup of the corrupted file
      now = datetime.now(timezone.utc)
      os.rename(SESSIONS_PATH, SESSIONS_PATH.as_posix() + f".{now.strftime('%Y-%m-%d_%H-%M-%S')}.bak")

      print("Warning: sessions.json is corrupted, starting with empty session data")
      _sessions = {}

def save_sessions():
  # This could eventually become out of hand if there are a lot of sessions
  # Perhaps sessions should be collapsed when they are over two weeks old (the reason sessions even exist)

  # Save to a temp file to avoid corrupting the original
  with tempfile.NamedTemporaryFile(mode="w", dir=str(SESSIONS_PATH.parent), delete=False) as tf:
    json.dump(_sessions, tf, indent=2, default=json_replacer)
    temp_path = Path(tf.name)
  temp_path.replace(SESSIONS_PATH)

#

def start_session(app_name: str, instance_id: str):
  print(f"Non-steam app {app_name} launched, starting session...")
  if not app_name in _sessions: _sessions[app_name] = []
  now = datetime.now(timezone.utc)
  _sessions[app_name].append({
    "instance_id": instance_id,
    "started_at": now,
    "ended_at": now,
  })

def ping_session(app_name: str, instance_id: str):
  # Avoid spamming the console with this
  # print(f"Non-steam app {app_name} still running, pinging session...")
  for session in _sessions[app_name]:
    if session.get("instance_id", None) == instance_id:
      session["ended_at"] = datetime.now(timezone.utc)
      save_sessions()
      break

def stop_session(app_name: str, instance_id: str):
  print(f"Non-steam app {app_name} stopped, ending session...")
  for session in _sessions[app_name]:
    if session.get("instance_id", None) == instance_id:
      session["ended_at"] = datetime.now(timezone.utc)
      del session["instance_id"]
      save_sessions()
      break

def get_playtime(app_name: str):
  TWO_WEEKS_AGO = datetime.now(timezone.utc) - timedelta(days=14)

  minutes_forever = 0
  minutes_last_two_weeks = 0
  last_played_at = None

  for session in _sessions[app_name] if app_name in _sessions else []:

    # Get minutes between started_at and ended_at
    started_at = session["started_at"]
    ended_at = session["ended_at"]
    minutes = (ended_at - started_at).total_seconds() / 60

    if started_at > TWO_WEEKS_AGO:
      minutes_last_two_weeks += minutes
    minutes_forever += minutes

    # Update last_played_at if necessary
    if last_played_at is None or ended_at > last_played_at:
      last_played_at = ended_at

  return {
    "minutes_forever": minutes_forever,
    "minutes_last_two_weeks": minutes_last_two_weeks,
    "last_played_at": last_played_at,
  }
