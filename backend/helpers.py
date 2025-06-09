from datetime import datetime

def json_dumps_stringify(value):
  if isinstance(value, datetime):
    return value.isoformat()

def json_loads_parse(object):
  for key, value in object.items():
    try:
      object[key] = datetime.fromisoformat(str(value))
    except ValueError:
      object[key] = value
  return object
