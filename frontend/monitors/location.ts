import { waitFor } from '../helpers.js';
import Steam from '../steam.js';

/**
 * Monitor the location of the Steam window
 * @param options Options for the monitor
 */
export async function monitorLocation({
  onChange,
}: {
  onChange?: (location: Steam.MainWindowBrowserLocation) => void;
}) {
  await waitFor(() => Steam.MainWindowBrowserManager);
  const history = Steam.MainWindowBrowserManager.m_history;

  let lastLocation = { pathname: '' };
  history.listen((location) => {
    if (lastLocation.pathname === location.pathname) return;
    lastLocation = location;
    onChange?.(location);
  });
}
