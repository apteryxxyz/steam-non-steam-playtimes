from pathlib import Path
from datetime import datetime, timezone, timedelta
import json
from typing import TypedDict, NotRequired

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
    with open(SESSIONS_PATH, "r") as f:
      _sessions = json.load(f, object_hook=json_reviver)

def save_sessions():
  # This could eventually become out of hand if there are a lot of sessions
  # Perhaps sessions should be collapsed when they are over two weeks old (the reason sessions even exist)
  SESSIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
  with open(SESSIONS_PATH, "w") as f:
    json.dump(_sessions, f, indent=2, default=json_replacer)

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
    if session.get("instance_id", None) == instance_id:
      session["ended_at"] = datetime.now(timezone.utc)
      save_sessions()
      break

def stop_session(app_name: str, instance_id: str):
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
