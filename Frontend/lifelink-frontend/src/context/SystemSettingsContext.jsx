import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const SystemSettingsContext = createContext({
  loading: false,
  platformName: "LifeLink",
  systemLogo: null,
  refresh: async () => {},
});

const STORAGE_KEY = "lifelink_system_settings_v1";

const safeParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export function SystemSettingsProvider({ children }) {
  const cached = safeParse(localStorage.getItem(STORAGE_KEY) || "");

  const [loading, setLoading] = useState(false);
  const [platformName, setPlatformName] = useState(cached?.platform_name || "LifeLink");
  const [systemLogo, setSystemLogo] = useState(cached?.system_logo || null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/system-settings");
      const data = res.data || {};

      setPlatformName(data.platform_name || "LifeLink");
      setSystemLogo(data.system_logo || null);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          platform_name: data.platform_name || "LifeLink",
          system_logo: data.system_logo || null,
          saved_at: Date.now(),
        })
      );
    } catch (e) {
      // Non-blocking: keep cached values
      // console.warn("Failed to fetch system settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Allow other parts of app to force refresh after admin updates settings
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("system-settings-changed", handler);
    return () => window.removeEventListener("system-settings-changed", handler);
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      platformName,
      systemLogo,
      refresh,
    }),
    [loading, platformName, systemLogo, refresh]
  );

  return <SystemSettingsContext.Provider value={value}>{children}</SystemSettingsContext.Provider>;
}

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}

