import { useRef, useCallback, useEffect } from "react";
import { StorageService } from "../services/storageService";
import { SyncService } from "../services/syncService";
import { buildSessionRecord } from "../utils/sessionUtils";

export const useSessionManager = (items, groupData, userData) => {
  const initialSnapshot = useRef(null);
  const sessionStartTime = useRef(null);
  const remoteSessionIdRef = useRef(null);
  // Bumped on every startSession so a slow start_session response can be
  // recognized as belonging to an old session (see below).
  const sessionGenerationRef = useRef(0);

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

    // The uuid may only be kept if THIS session is still the current, active
    // one when the RPC resolves. Without the guard, a fast stop on a slow
    // network leaves the remote row 'active' forever and the late uuid lands
    // in the ref after reset — where the NEXT session's endSession would
    // complete the wrong row with the wrong data.
    sessionGenerationRef.current += 1;
    const generation = sessionGenerationRef.current;
    remoteSessionIdRef.current = null;

    SyncService.startRemoteSession({
      syncDeviceId: userData?.syncDeviceId,
      groupId: groupData?.id,
      workerName: userData?.name,
      startedAt: sessionStartTime.current,
    }).then((remoteSessionId) => {
      if (!remoteSessionId) return;
      const isSameSession = generation === sessionGenerationRef.current;
      const isStillActive = initialSnapshot.current !== null;
      if (isSameSession && isStillActive) {
        remoteSessionIdRef.current = remoteSessionId;
      } else {
        // This session already ended (or another one started) before the
        // start RPC resolved. Close the just-created row immediately so it
        // can't sit as status='active' forever; the real production data
        // still reaches the server via the unsynced-log retry on launch.
        SyncService.completeRemoteSession({
          remoteSessionId,
          items: { production: [], deletedDuringSession: [] },
          durationSeconds: 0,
          endedAt: new Date().toISOString(),
        });
      }
    });
  }, [groupData, userData]);

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

      // Persist the completed session locally (source for future Supabase sync).
      // Tagged unsynced until Supabase confirms the write, so a launch-time
      // retry can pick it up if this attempt fails (e.g. offline).
      StorageService.appendSessionLog({ ...sessionRecord, synced: false }).catch(
        (e) => console.error("Failed to save session log", e),
      );

      SyncService.completeRemoteSession({
        remoteSessionId: remoteSessionIdRef.current,
        items: {
          production: sessionRecord.production,
          deletedDuringSession: sessionRecord.deletedDuringSession,
        },
        durationSeconds: durationInSeconds,
        endedAt: sessionRecord.endTime,
      }).then((success) => {
        if (success) {
          StorageService.markSessionSynced(sessionRecord.sessionId);
        }
      });

      console.log(
        "📦 Final Session Record:\n",
        JSON.stringify(sessionRecord, null, 2),
      );

      // Reset memory
      initialSnapshot.current = null;
      sessionStartTime.current = null;
      remoteSessionIdRef.current = null;

      return sessionRecord;
    },
    [groupData, userData],
  );

  return { startSession, endSession };
};
