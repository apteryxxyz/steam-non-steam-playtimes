import type {} from '@steambrew/client';

// @steambrew/client types are not complete and they make it impossible to merge with your own types, so we have to do this

type SB_AppOverview = NonNullable<
  ReturnType<(typeof window)['appStore']['GetAppOverviewByAppID']>
>;

namespace Steam {
  // ===== PopupManager ===== //

  export interface PopupManager {
    GetExistingPopup(name: string): PopupContext;
    AddPopupCreatedCallback(callback: (context: PopupContext) => void): void;
  }

  export interface PopupContext {
    m_strName: string;
    m_popup: Window;
    m_element: Element;
  }

  export const PopupManager: PopupManager = Reflect.get(
    globalThis,
    'g_PopupManager',
  );

  // ===== MainWindowBrowser ===== //

  export const MainWindowName = 'SP Desktop_uid0';

  export interface MainWindowBrowserLocation
    extends Pick<URL, 'pathname' | 'search' | 'hash'> {}

  export interface MainWindowBrowser {
    on(
      name: 'finished-request',
      listener: (url: string, title: string) => void,
    ): void;
  }

  export interface MainWindowBrowserHistory {
    listen(callback: (location: MainWindowBrowserLocation) => void): void;
  }

  export interface MainWindowBrowserManager {
    m_browser: MainWindowBrowser;
    m_history: MainWindowBrowserHistory;
    m_lastLocation: MainWindowBrowserLocation;
  }

  export const MainWindowBrowserManager: MainWindowBrowserManager = undefined!;
  Object.defineProperty(Steam, 'MainWindowBrowserManager', {
    get: () => Reflect.get(globalThis, 'MainWindowBrowserManager'),
    enumerable: true,
    configurable: true,
  });

  // ===== AppOverview ===== //

  interface BaseAppOverview extends Omit<SB_AppOverview, 'size_on_disk'> {
    appid: number;
    display_name: string;
    sort_as: string;
  }

  export interface SteamAppOverview extends BaseAppOverview {
    library_id: string;
    size_on_disk: `${number}` | undefined;
  }

  export interface NonSteamAppOverview extends BaseAppOverview {
    library_id: undefined;
    size_on_disk: '0';
  }

  export type AppOverview = SteamAppOverview | NonSteamAppOverview;

  // ===== UIStore ===== //

  export interface UIStore {
    RunningApps: AppOverview[];
  }

  export const UIStore: UIStore = Reflect.get(globalThis, 'SteamUIStore');

  // ===== AppStore ===== //

  export interface AppStore {
    allApps: AppOverview[];
  }

  export const AppStore: AppStore = Reflect.get(globalThis, 'appStore');
}

export default Steam;
