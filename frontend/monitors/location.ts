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
  onChange?: (location: Steam.MainWindowBrowserLocation) => Promise<void>;
  signal?: AbortSignal;
}) {
  await waitFor(() => Steam.MainWindowBrowserManager);

  let lastLocation = { pathname: '' };

  const monitor = setInterval(() => {
    if (signal?.aborted) return clearInterval(monitor);

    const location = Steam.MainWindowBrowserManager.m_lastLocation;
    if (lastLocation.pathname === location.pathname) return;
    lastLocation = location;
    onChange?.(location)?.catch(console.error);
  }, MONITOR_LOCATION_POLL_INTERVAL);
}
