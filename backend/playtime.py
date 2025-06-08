from datetime import datetime, timezone, timedelta
from pathlib import Path
import json

SAVE_PATH = Path.home() / "Documents" / "Apteryx" / "Non-Steam" / "sessions.json"
TWO_WEEKS_AGO = datetime.now(timezone.utc) - timedelta(days=14)

#

_sessions = []

def load_sessions():
  global _sessions
  if SAVE_PATH.exists():
    with open(SAVE_PATH, "r") as f:
      _sessions = json.load(f)

def save_sessions():
  # This could eventually become out of hand if there are a lot of sessions
  # Perhaps sessions should be collapsed when they are over two weeks old (the reason sessions even exist)
  SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
  with open(SAVE_PATH, "w") as f:
    json.dump(_sessions, f, indent=2)

#

def start_session(app_name: str, instance_id: str):
  # We use app name due to app id for non-steam games being arbitrary

  now = datetime.now(timezone.utc).isoformat()
  _sessions.append({
    "app_name": app_name,
    "instance_id": instance_id,
    "started_at": now,
    "ended_at": now,
  })
  save_sessions()

def ping_session(instance_id: str):
  for session in _sessions:
    if "instance_id" in session and session["instance_id"] == instance_id:
      now = datetime.now(timezone.utc).isoformat()
      session["ended_at"] = now
      save_sessions()
      break

def stop_session(instance_id: str):
  for session in _sessions:
    if "instance_id" in session and session["instance_id"] == instance_id:
      now = datetime.now(timezone.utc).isoformat()
      session["ended_at"] = now
      del session["instance_id"]
      save_sessions()
      break

def get_playtime(app_name: str):
  forever = 0
  last_two_weeks = 0
  last_played_at = None

  for session in _sessions:
    if session["app_name"] == app_name:

      # Get minutes between started_at and ended_at
      started_at = datetime.fromisoformat(session["started_at"])
      ended_at = datetime.fromisoformat(session["ended_at"])
      minutes = (ended_at - started_at).total_seconds() / 60

      # If within last two weeks, add to last_two_weeks
      if started_at > TWO_WEEKS_AGO:
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
