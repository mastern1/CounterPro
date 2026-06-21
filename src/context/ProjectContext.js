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
import { generateId, getRandomColor } from "../utils/generators";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // ─── 1. State ───
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // ─── 2. Refs ───
  const saveTimeoutRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const previousGroupsRef = useRef(null);

  // ─── 3. Initial load ───
  useEffect(() => {
    const initApp = async () => {
      try {
        const data = await StorageService.loadAll();
        setGroups(data.groups);
        previousGroupsRef.current = JSON.stringify(data.groups);
        setUserData(data.user);
        setIsGridLayout(data.layout);
      } catch (e) {
        console.error("Initialization Failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // ─── 4. Smart Save logic ───
  useEffect(() => {
    if (isLoading) return;
    const groupsString = JSON.stringify(groups);
    if (groupsString === previousGroupsRef.current) return;
    previousGroupsRef.current = groupsString;

    const saveNow = async () => {
      try {
        await StorageService.saveGroups(groups);
        console.log("✅ Smart Save Executed");
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
  }, [groups, isLoading]);

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
