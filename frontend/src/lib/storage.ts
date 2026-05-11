import { defaultMenu, defaultPreferences } from "../data/appData";
import type { HistoryItem, Preferences } from "../data/appData";

const MENU_KEY = "eat-what-menu";
const PREF_KEY = "eat-what-preferences";
const HISTORY_KEY = "eat-what-history";

export function loadMenu() {
  return localStorage.getItem(MENU_KEY) || defaultMenu;
}

export function saveMenu(menu: string) {
  localStorage.setItem(MENU_KEY, menu);
}

export function loadPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(PREF_KEY);

    if (!saved) {
      return defaultPreferences;
    }

    return {
      ...defaultPreferences,
      ...JSON.parse(saved),
    };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
}

export function loadLocalHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function clearLocalHistory() {
  localStorage.removeItem(HISTORY_KEY);
}