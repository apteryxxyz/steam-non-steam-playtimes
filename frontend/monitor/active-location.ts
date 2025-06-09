import { waitFor } from '../helpers.js';
import Steam from '../steam.js';

export async function monitorActiveLocation({
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
