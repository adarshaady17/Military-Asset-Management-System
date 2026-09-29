import { useEffect, useState } from "react";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../hooks/useAuth";
import { BaseContext } from "./BaseContextValue.js";
export function BaseProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [adminSelection, setAdminSelection] = useState({ userId: "", baseId: "" });
  const [reloadVersion, setReloadVersion] = useState(0);
  const [baseResult, setBaseResult] = useState({ key: "", bases: [], error: "" });
  const userId = currentUser?.id || "";
  const requestKey = `${userId}:${reloadVersion}`;

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;
    let active = true;
    resourceService
      .list("bases")
      .then((response) => {
        if (active) {
          setBaseResult({
            key: requestKey,
            bases: Array.isArray(response.data) ? response.data : [],
            error: "",
          });
        }
      })
      .catch((error) => {
        if (active) {
          setBaseResult({ key: requestKey, bases: [], error: error.message || "Unable to load bases." });
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, requestKey, userId]);

  const isCurrentResult = baseResult.key === requestKey;
  const bases = isCurrentResult ? baseResult.bases : [];
  const basesLoading = Boolean(isAuthenticated && userId && !isCurrentResult);
  const basesError = isCurrentResult ? baseResult.error : "";
  const selectedBase =
    currentUser?.role === "ADMIN"
      ? adminSelection.userId === userId
        ? adminSelection.baseId
        : ""
      : currentUser?.base?.id || "";
  const setSelectedBase = (baseId) => setAdminSelection({ userId, baseId });
  const reloadBases = () => setReloadVersion((version) => version + 1);

  return (
    <BaseContext.Provider
      value={{
        bases,
        basesLoading,
        basesError,
        reloadBases,
        selectedBase,
        setSelectedBase,
      }}
    >
      {children}
    </BaseContext.Provider>
  );
}
