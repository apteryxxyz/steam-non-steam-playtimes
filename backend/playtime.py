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

def collapse_sessions():
  TWO_WEEKS_AGO = datetime.now(timezone.utc) - timedelta(days=14)
  UNIX_EPOCH = datetime.fromtimestamp(0, timezone.utc)

  for sessions in _sessions.values():
    zero_session = None
    latest_session = None
    stale_sessions = []

    for session in sessions:
      if session["started_at"] == UNIX_EPOCH:
        zero_session = session
      if not latest_session or session["ended_at"] > latest_session["ended_at"]:
        latest_session = session
      if session["ended_at"] < TWO_WEEKS_AGO:
        stale_sessions.append(session)

    if zero_session is None:
      zero_session = {"started_at": UNIX_EPOCH, "ended_at": UNIX_EPOCH}
      sessions.insert(0, zero_session)

    for session in stale_sessions:
      if session is not latest_session and session is not zero_session:
        session_time = session["ended_at"] - session["started_at"]
        zero_session["ended_at"] += session_time
        sessions.remove(session)

def save_sessions():
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
      collapse_sessions()
      save_sessions()
      break

def get_playtime(app_name: str):
  TWO_WEEKS_AGO = datetime.now(timezone.utc) - timedelta(days=14)
  UNIX_EPOCH = datetime.fromtimestamp(0, timezone.utc)

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
    if started_at != UNIX_EPOCH and (last_played_at is None or ended_at > last_played_at):
      last_played_at = ended_at

  return {
    "minutes_forever": minutes_forever,
    "minutes_last_two_weeks": minutes_last_two_weeks,
    "last_played_at": last_played_at,
  }

def set_playtime(app_name: str, minutes_forever: int):
  UNIX_EPOCH = datetime.fromtimestamp(0, timezone.utc)

  sessions = _sessions.get(app_name, [])
  current_minutes = sum(
    (s["ended_at"] - s["started_at"]).total_seconds() / 60
    for s in sessions
  )

  if minutes_forever >= current_minutes:
    extra_minutes = minutes_forever - current_minutes
    zero_session = next((s for s in sessions if s["started_at"] == UNIX_EPOCH), None)
    if zero_session is None:
      zero_session = {"started_at": UNIX_EPOCH, "ended_at": UNIX_EPOCH}
      sessions.append(zero_session)
    zero_session["ended_at"] += timedelta(minutes=extra_minutes)
  else:
    zero_session = {
      "started_at": UNIX_EPOCH,
      "ended_at": UNIX_EPOCH + timedelta(minutes=minutes_forever),
    }
    sessions = [zero_session]

  _sessions[app_name] = sessions
  save_sessions()
