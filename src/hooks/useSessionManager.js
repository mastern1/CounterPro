import { useRef, useCallback, useEffect } from "react";

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

      const sessionChanges = [];
      const currentItems = latestItemsRef.current;
      const initialItems = initialSnapshot.current;

      // 1️⃣ Check existing and deleted items
      initialItems.forEach((oldItem) => {
        const currentItem = currentItems.find((i) => i.id === oldItem.id);
        const finalCount = currentItem ? currentItem.count : oldItem.count;
        const addedAmount = finalCount - oldItem.count;

        if (addedAmount > 0) {
          sessionChanges.push({
            itemId: oldItem.id,
            itemName: oldItem.name,
            addedAmount: addedAmount,
            status: currentItem ? "active" : "deleted_during_session",
          });
        }
      });

      // 2️⃣ Check BRAND NEW items added during the session (Claude's golden touch ✨)
      currentItems.forEach((currentItem) => {
        const isNew = !initialItems.find((i) => i.id === currentItem.id);
        if (isNew && currentItem.count > 0) {
          sessionChanges.push({
            itemId: currentItem.id,
            itemName: currentItem.name,
            addedAmount: currentItem.count,
            status: "added_during_session",
          });
        }
      });

      // 🚀 Prepare the final payload for Supabase
      const sessionRecord = {
        sessionId: Date.now().toString(),
        workerName: userData?.name || "Unknown Worker",
        groupId: groupData?.id || "no_group_id",
        groupName: groupData?.name || "Unknown Group",
        startTime: sessionStartTime.current,
        endTime: new Date().toISOString(),
        durationSeconds: durationInSeconds,
        production: sessionChanges,
        deletedDuringSession: initialItems // ✅ أضف هذا
          .filter(
            (old) =>
              !currentItems.find((c) => c.id === old.id) ||
              currentItems.find((c) => c.id === old.id)?.isDeleted,
          )
          .map((item) => ({
            itemId: item.id,
            itemName: item.name,
            count: item.count,
          })),
      };

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
