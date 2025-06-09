from datetime import datetime, timezone, timedelta
from typing import TypedDict, NotRequired
from pathlib import Path
import helpers
import json
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
    with open(SESSIONS_PATH, "r") as f:
      _sessions = json.load(f, object_hook=helpers.json_loads_parse)

def save_sessions():
  # This could eventually become out of hand if there are a lot of sessions
  # Perhaps sessions should be collapsed when they are over two weeks old (the reason sessions even exist)
  SESSIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
  with open(SESSIONS_PATH, "w") as f:
    json.dump(_sessions, f, indent=2, default=helpers.json_dumps_stringify)

#

def start_session(app_name: str, instance_id: str):
  if not app_name in _sessions: _sessions[app_name] = []
  now = datetime.now(timezone.utc)
  _sessions[app_name].append({
    "instance_id": instance_id,
    "started_at": now,
    "ended_at": now,
  })

def ping_session(app_name: str, instance_id: str):
  for session in _sessions[app_name]:
    if "instance_id" in session and session["instance_id"] == instance_id:
      session["ended_at"] = datetime.now(timezone.utc)
      save_sessions()
      break

def stop_session(app_name: str, instance_id: str):
  for session in _sessions[app_name]:
    if "instance_id" in session and session["instance_id"] == instance_id:
      session["ended_at"] = datetime.now(timezone.utc)
      del session["instance_id"]
      save_sessions()
      break

def get_playtime(app_name: str):
  forever = 0
  last_two_weeks = 0
  last_played_at = None
  two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)

  for session in _sessions[app_name] if app_name in _sessions else []:

    # Get minutes between started_at and ended_at
    started_at = session["started_at"]
    ended_at = session["ended_at"]
    minutes = (ended_at - started_at).total_seconds() / 60

    # If within last two weeks, add to last_two_weeks
    if started_at > two_weeks_ago:
      last_two_weeks += minutes
    forever += minutes

    # Update last_played_at if necessary
    if last_played_at is None or ended_at > last_played_at:
      last_played_at = ended_at

  return {
    "last_played_at": last_played_at,
    "last_two_weeks": last_two_weeks,
    "forever": forever,
  }
