import { MONITOR_RUNNING_APPS_POLL_INTERVAL } from '../constants.js';
import type { Awaitable, Voidable } from '../helpers.js';
import Steam from '../steam.js';

/**
 * Monitor running applications and trigger when they launch, quit or heartbeat
 * @param onLaunch Callback to trigger when an app launches
 * @returns A function to stop monitoring
 */
export function onAppLaunch(
  onLaunch: (
    app: Steam.AppOverview,
    handlers: {
      onLaunch: (onLaunch: VoidFunction) => void;
      onHeartbeat: (onHeartbeat: VoidFunction) => void;
      onQuit: (onQuit: VoidFunction) => void;
    },
  ) => Awaitable<Voidable<VoidFunction>>,
) {
  const onHeartbeatMap = new Map<number, Set<VoidFunction>>();
  const onQuitMap = new Map<number, Set<VoidFunction>>();

  async function checkRunningApps() {
    const runningApps = new Set(Steam.UIStore.RunningApps);
    const seenAppNames = new Set<number>();

    for (const app of runningApps) {
      seenAppNames.add(app.appid);

      if (!onQuitMap.has(app.appid)) {
        onQuitMap.set(app.appid, new Set());
        onHeartbeatMap.set(app.appid, new Set());

        const onQuit = await onLaunch(app, {
          onLaunch: (cb: VoidFunction) => cb(),
          onHeartbeat: (cb: VoidFunction) =>
            onHeartbeatMap.get(app.appid)!.add(cb),
          onQuit: (cb: VoidFunction) => onQuitMap.get(app.appid)!.add(cb),
        });
        if (onQuit) onQuitMap.get(app.appid)!.add(onQuit);
      } else {
        const onHeartbeatSet = onHeartbeatMap.get(app.appid)!;
        onHeartbeatSet.forEach((cb) => cb());
      }
    }

    for (const [appid, onQuitSet] of onQuitMap) {
      if (!seenAppNames.has(appid)) {
        onQuitMap.delete(appid);
        onHeartbeatMap.delete(appid);
        onQuitSet.forEach((cb) => cb());
      }
    }
  }

  checkRunningApps();
  const monitor = setInterval(
    checkRunningApps,
    MONITOR_RUNNING_APPS_POLL_INTERVAL,
  );
  return () => clearInterval(monitor);
}
