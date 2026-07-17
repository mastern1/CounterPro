import {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { AppState } from "react-native";
import { StorageService } from "../services/storageService";
import { SyncService } from "../services/syncService";
import { generateId, getRandomColor } from "../utils/generators";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // ─── 1. State ───
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [syncDeviceId, setSyncDeviceId] = useState(null);

  // ─── 2. Refs ───
  const saveTimeoutRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const previousGroupsRef = useRef(null);

  // ─── 3. Initial load ───
  useEffect(() => {
    const initApp = async () => {
      try {
        const [data, deviceId] = await Promise.all([
          StorageService.loadAll(),
          StorageService.getSyncDeviceId(),
        ]);
        setGroups(data.groups);
        previousGroupsRef.current = JSON.stringify(data.groups);
        setUserData(data.user);
        setIsGridLayout(data.layout);
        setSyncDeviceId(deviceId);
      } catch (e) {
        console.error("Initialization Failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // ─── 4. Register/refresh this device on Supabase whenever identity is known,
  // and retry uploading any session logs that never made it up (e.g. a
  // session that ran entirely while offline) ───
  useEffect(() => {
    if (isLoading || !syncDeviceId || !userData) return;
    const syncOnLaunch = async () => {
      // Retry must wait for registration: sessions.device_id has a foreign
      // key on devices, so uploading before the device row exists fails.
      await SyncService.registerDevice(syncDeviceId, userData.name);
      SyncService.retryUnsyncedSessions(syncDeviceId);
    };
    syncOnLaunch();
  }, [isLoading, syncDeviceId, userData]);

  // ─── 5. Smart Save logic ───
  useEffect(() => {
    if (isLoading) return;
    const groupsString = JSON.stringify(groups);
    if (groupsString === previousGroupsRef.current) return;

    const saveNow = async () => {
      // The AppState listener outlives a successful debounced save (nothing
      // re-runs this effect), so a later background flush would re-save and
      // re-sync identical data without this check.
      if (groupsString === previousGroupsRef.current) return;
      try {
        await StorageService.saveGroups(groups);
        previousGroupsRef.current = groupsString; // only mark "saved" once it actually is
        console.log("✅ Smart Save Executed");
        SyncService.syncGroupsAndCounters(syncDeviceId, groups);
      } catch (e) {
        console.error("❌ Save failed", e);
      }
    };

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveNow, 500);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveNow();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [groups, isLoading, syncDeviceId]);

  // ─── 5. Persist layout ───
  useEffect(() => {
    if (!isLoading) {
      StorageService.saveLayout(isGridLayout);
    }
  }, [isGridLayout, isLoading]);

  // ─── 6. Optimized functions ───

  // Login
  const loginUser = useCallback(async (name, deviceId) => {
    const user = { name, deviceId, loginTime: new Date().toISOString() };
    setUserData(user);
    await StorageService.saveUser(user);
  }, []);

  // Logout
  const logoutUser = useCallback(async () => {
    const success = await StorageService.clearAll();
    if (success) {
      setGroups([]);
      setUserData(null);
      setIsGridLayout(true);
    }
  }, []);

  // Toggle layout
  const toggleLayout = useCallback(() => {
    setIsGridLayout((prev) => !prev);
  }, []);

  // Add group (using prev avoids depending on groups)
  const addNewGroup = useCallback(
    (name) => {
      if (!userData) return;
      const newGroup = {
        id: generateId(),
        name: name,
        color: getRandomColor(),
        createdAt: new Date().toISOString(),
        createdBy: userData.name,
        deviceId: userData.deviceId,
        items: [],
      };
      setGroups((prev) => [newGroup, ...prev]);
    },
    [userData],
  ); // userData rarely changes

  // Edit group
  const editGroup = useCallback((groupId, newName) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g)),
    );
  }, []);

  // Delete group
  const deleteGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  // Update a group's items
  const updateGroup = useCallback((groupId, newItems) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, items: newItems } : g)),
    );
  }, []);

  // ─── 7. Final memoized value ───
  // This is the real performance shield
  const contextValue = useMemo(
    () => ({
      groups,
      userData,
      isGridLayout,
      isLoading,
      syncDeviceId,
      loginUser,
      logoutUser,
      toggleLayout,
      addNewGroup,
      deleteGroup,
      updateGroup,
      editGroup,
    }),
    [
      groups,
      userData,
      isGridLayout,
      isLoading,
      syncDeviceId,
      loginUser,
      logoutUser,
      toggleLayout,
      addNewGroup,
      deleteGroup,
      updateGroup,
      editGroup,
    ],
  );

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
