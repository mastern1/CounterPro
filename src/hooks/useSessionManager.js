import { useRef, useCallback, useEffect } from "react";
import { StorageService } from "../services/storageService";
import { buildSessionRecord } from "../utils/sessionUtils";

export const useSessionManager = (items, groupData, userData) => {
  const initialSnapshot = useRef(null);
  const sessionStartTime = useRef(null);

  const latestItemsRef = useRef(items);
  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  // 🟢 Start Session
  const startSession = useCallback(() => {
    console.log("▶️ Session Started...");
    sessionStartTime.current = new Date().toISOString();
    initialSnapshot.current = JSON.parse(
      JSON.stringify(latestItemsRef.current),
    );
  }, []);

  // 🔴 End Session
  const endSession = useCallback(
    (durationInSeconds) => {
      console.log("⏹️ Session Ended. Duration:", durationInSeconds, "seconds");

      if (!initialSnapshot.current) {
        console.warn("⚠️ No active session to end.");
        return null;
      }

      // Build the production record by diffing start snapshot vs current items
      const sessionRecord = buildSessionRecord({
        snapshot: initialSnapshot.current,
        currentItems: latestItemsRef.current,
        workerName: userData?.name,
        groupId: groupData?.id,
        groupName: groupData?.name,
        startTime: sessionStartTime.current,
        durationSeconds: durationInSeconds,
        status: "completed",
      });

      // Persist the completed session locally (source for future Supabase sync)
      StorageService.appendSessionLog(sessionRecord).catch((e) =>
        console.error("Failed to save session log", e),
      );

      console.log(
        "📦 Final Session Record:\n",
        JSON.stringify(sessionRecord, null, 2),
      );

      // Reset memory
      initialSnapshot.current = null;
      sessionStartTime.current = null;

      return sessionRecord;
    },
    [groupData, userData],
  );

  return { startSession, endSession };
};
