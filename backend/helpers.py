from datetime import datetime

def json_replacer(value):
  """
  Replacer for JSON, handling datetime objects
  """
  if isinstance(value, datetime):
    return value.isoformat()

def json_reviver(object):
  """
  Reviver for JSON, handling datetime objects
  """
  for key, value in object.items():
    try:
      object[key] = datetime.fromisoformat(str(value))
    except ValueError:
      object[key] = value
  return object
