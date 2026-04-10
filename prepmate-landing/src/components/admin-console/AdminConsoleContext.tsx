import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { adminConsoleApi } from "./services/adminConsoleApi";
import { AdminInsights, AdminOverview, Notice } from "./types";
import { getErrorMessage } from "./utils";

interface AdminConsoleContextValue {
  overview: AdminOverview | null;
  insights: AdminInsights | null;
  isLoadingCore: boolean;
  notice: Notice | null;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
  refreshCore: () => Promise<void>;
  runWithNotice: (
    action: () => Promise<void>,
    successMessage: string,
    options?: { refreshCore?: boolean }
  ) => Promise<void>;
}

const AdminConsoleContext = createContext<AdminConsoleContextValue | null>(null);

export const AdminConsoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [isLoadingCore, setIsLoadingCore] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const refreshCore = useCallback(async () => {
    setIsLoadingCore(true);

    try {
      const [nextOverview, nextInsights] = await Promise.all([
        adminConsoleApi.getOverview(),
        adminConsoleApi.getInsights(),
      ]);

      setOverview(nextOverview);
      setInsights(nextInsights);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingCore(false);
    }
  }, []);

  useEffect(() => {
    void refreshCore();
  }, [refreshCore]);

  const runWithNotice = useCallback(
    async (
      action: () => Promise<void>,
      successMessage: string,
      options?: { refreshCore?: boolean }
    ) => {
      try {
        setNotice(null);
        await action();

        if (options?.refreshCore !== false) {
          await refreshCore();
        }

        setNotice({
          type: "success",
          message: successMessage,
        });
      } catch (error) {
        setNotice({
          type: "error",
          message: getErrorMessage(error),
        });
      }
    },
    [refreshCore]
  );

  const value = useMemo(
    () => ({
      overview,
      insights,
      isLoadingCore,
      notice,
      setNotice,
      refreshCore,
      runWithNotice,
    }),
    [insights, isLoadingCore, notice, overview, refreshCore, runWithNotice]
  );

  return (
    <AdminConsoleContext.Provider value={value}>
      {children}
    </AdminConsoleContext.Provider>
  );
};

export const useAdminConsole = () => {
  const context = useContext(AdminConsoleContext);

  if (!context) {
    throw new Error("useAdminConsole must be used within AdminConsoleProvider");
  }

  return context;
};
