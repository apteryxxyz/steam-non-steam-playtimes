import { MONITOR_LOCATION_POLL_INTERVAL } from '../constants.js';
import type { Awaitable, Voidable } from '../helpers.js';

type Location = { pathname: string; search: string; hash: string };

function normaliseLocation(location: Location): Location {
  return {
    pathname: location.pathname
      // Big picture mode pathname is prepended with "/routes"
      .replace('/routes', ''),
    search: location.search,
    hash: location.hash,
  };
}

/**
 * Monitor a location for changes and trigger an action when it happens
 * @param getLocation Getter function to get the current location, different depending on the context
 * @param handleChange Callback to trigger when the location changes
 * @returns A function to stop monitoring
 */
export function onLocationChange(
  getLocation: () => Voidable<Location>,
  handleChange: (location: Location) => Awaitable<void>,
) {
  let inFlight = false;
  let lastLocation: Location | undefined;

  async function checkLocation() {
    if (inFlight) return;

    const currentLocation = getLocation();
    if (
      !currentLocation ||
      (lastLocation?.pathname === currentLocation.pathname &&
        lastLocation?.search === currentLocation.search &&
        lastLocation?.hash === currentLocation.hash)
    )
      return;
    lastLocation = { ...currentLocation };

    inFlight = true;
    await handleChange(normaliseLocation(currentLocation));
    inFlight = false;
  }

  checkLocation();
  const monitor = setInterval(checkLocation, MONITOR_LOCATION_POLL_INTERVAL);
  return () => clearInterval(monitor);
}
