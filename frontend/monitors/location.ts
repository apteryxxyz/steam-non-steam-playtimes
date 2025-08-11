import { MONITOR_LOCATION_POLL_INTERVAL } from '../constants.js';
import { waitFor } from '../helpers.js';
import Steam from '../steam.js';

// In previous versions of this, it just added a listener on history, but
// for whatever reason, when exiting Big Picture mode, the listener would
// be removed

/**
 * Monitor the location of the Steam window
 * @param options Options for the monitor
 */
export async function monitorLocation({
  onChange,
  signal,
}: {
  onChange?: (location: Steam.MainWindowBrowserLocation) => void;
  signal?: AbortSignal;
}) {
  await waitFor(() => Steam.MainWindowBrowserManager);

  let lastLocation = { pathname: '', search: '', hash: '' };

  const monitor = setInterval(() => {
    if (signal?.aborted) return clearInterval(monitor);

    const location = Steam.MainWindowBrowserManager.m_lastLocation;
    if (
      lastLocation.pathname === location.pathname &&
      lastLocation.search === location.search &&
      lastLocation.hash === location.hash
    )
      return;

    lastLocation = structuredClone(location);
    onChange?.(location);
  }, MONITOR_LOCATION_POLL_INTERVAL);
}
