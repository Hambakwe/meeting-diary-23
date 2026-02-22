/**
 * Settings Store - Manages app customization settings
 */

export interface AppSettings {
  // Logo settings
  logoLight: string;
  logoDark: string;
  logoFallbackText: string;

  // Branding
  companyName: string;

  // Project defaults
  defaultProjectName: string;
  defaultProjectDescription: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  logoLight: '/images/logo/ocf-logo.png',
  logoDark: '/images/logo/OCFLogoSTrans.png', // White logo for dark mode
  logoFallbackText: 'OCF',
  companyName: 'Oasis Capital Finance',
  defaultProjectName: 'OCF Bond Issuance Project',
  defaultProjectDescription: 'Project Timeline & Task Management',
};

const SETTINGS_KEY = 'gantt-app-settings';

/**
 * Get all settings
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Update settings
 */
export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...updates };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }

  return updated;
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to reset settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Get default settings (for reference)
 */
export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}
