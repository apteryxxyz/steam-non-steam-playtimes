import { Button, findClassModule, TextField } from '@steambrew/client';
import { createMs, Time } from 'enhanced-ms';
import { useCallback, useMemo, useState } from 'react';
import rpc from '../rpc.js';
import Steam from '../steam.js';

const ms = createMs({
  formatOptions: {
    includedUnits: ['day', 'hour', 'minute'],
    useAbbreviations: true,
  },
});

const SettingsStyles = findClassModule((m) => m.SectionTopLine)!;

export function PlaytimePropertiesPage({ app }: { app: Steam.AppOverview }) {
  const [minutesForever, setMinutesForever] = //
    useState(app.minutes_playtime_forever);
  const [initialMinutesForever] = useState(minutesForever);
  const isValid = useMemo(
    () => !Number.isNaN(minutesForever) || minutesForever > Time.Year * 25,
    [minutesForever],
  );

  const [saveState, setSaveState] = useState('Save');
  const setPlaytime = useCallback(async () => {
    setSaveState('Saving...');
    await rpc.SetPlaytime(app.display_name, minutesForever);
    setSaveState('Saved');
    setTimeout(() => {
      setSaveState('Save');
      // Force location monitor to detect a "refresh" of the page to
      // instantly update the playtime
      Steam.MainWindowBrowserManager.m_lastLocation.hash += 'r';
    }, 2000);
  }, [app.display_name, minutesForever]);

  return (
    <div className="DialogBody">
      <div>
        <div className={SettingsStyles.Title}>Playtime</div>
        <div>
          Manually set the total playtime for this app. Reducing it below the
          current total will reset date-based playtime statistics.
        </div>
        <div className={SettingsStyles.AsyncBackedInputChildren}>
          <TextField
            defaultValue={ms(initialMinutesForever * 60 * 1000) ?? ''}
            onChange={(e) => {
              if (e.target.value === '') setMinutesForever(0);
              else setMinutesForever((ms(e.target.value) || NaN) / 1000 / 60);
            }}
            style={
              !isValid ? { border: 'red 1px solid', marginLeft: '1px' } : {}
            }
          />
          <Button
            className={`${SettingsStyles.SettingsDialogButton} ${SettingsStyles.ShortcutChange} DialogButton`}
            onClick={setPlaytime}
            disabled={!isValid}
          >
            {saveState}
          </Button>
        </div>
      </div>
    </div>
  );
}
