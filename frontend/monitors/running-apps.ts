import Steam from '../steam.js';

/**
 * Monitor the running applications that have been launched via Steam
 * @param options Options for the monitor
 */
export async function monitorRunningApps({
  onStart,
  onStill,
  onStop,
  signal,
}: {
  onStart?: (app: Steam.AppOverview, instanceId: string) => void;
  onStill?: (app: Steam.AppOverview, instanceId: string) => void;
  onStop?: (app: Steam.AppOverview, instanceId: string) => void;
  signal?: AbortSignal;
}) {
  const instanceIds = new Map<string, string>();

  while (!signal?.aborted) {
    const currentApps = new Set(Steam.UIStore.RunningApps);
    const seenAppNames = new Set<string>();

    for (const app of currentApps) {
      seenAppNames.add(app.display_name);

      if (!instanceIds.has(app.display_name)) {
        const instanceId = Math.random().toString(36).slice(2);
        instanceIds.set(app.display_name, instanceId);
        onStart?.(app, instanceId);
      }

      const instanceId = instanceIds.get(app.display_name)!;
      onStill?.(app, instanceId);
    }

    for (const [name, instanceId] of instanceIds) {
      if (!seenAppNames.has(name)) {
        instanceIds.delete(name);
        const app = Steam.AppStore.allApps //
          .find((a) => a.display_name === name)!;
        onStop?.(app, instanceId);
      }
    }

    // Wait a bit before checking again
    await new Promise((r) => setTimeout(r, 10_000));
  }
}
