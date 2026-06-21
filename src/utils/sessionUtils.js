// src/utils/sessionUtils.js
//
// Pure helper that builds a session "production" record by diffing the
// snapshot taken at session start against the current items.
// Used by useSessionManager on session end. Kept as a standalone pure
// helper so the diff logic can be reused later (e.g. crash recovery)
// without duplication.

export const buildSessionRecord = ({
  snapshot,
  currentItems,
  workerName,
  groupId,
  groupName,
  startTime,
  durationSeconds = null,
  status = "completed",
}) => {
  const initialItems = snapshot || [];
  const items = currentItems || [];
  const production = [];

  // 1. Existing items: count how much was added (and whether they survived)
  initialItems.forEach((oldItem) => {
    const currentItem = items.find((i) => i.id === oldItem.id);
    const finalCount = currentItem ? currentItem.count : oldItem.count;
    const addedAmount = finalCount - oldItem.count;

    if (addedAmount > 0) {
      production.push({
        itemId: oldItem.id,
        itemName: oldItem.name,
        addedAmount,
        status: currentItem ? "active" : "deleted_during_session",
      });
    }
  });

  // 2. Brand-new items created during the session
  items.forEach((currentItem) => {
    const isNew = !initialItems.find((i) => i.id === currentItem.id);
    if (isNew && currentItem.count > 0) {
      production.push({
        itemId: currentItem.id,
        itemName: currentItem.name,
        addedAmount: currentItem.count,
        status: "added_during_session",
      });
    }
  });

  return {
    sessionId: Date.now().toString(),
    workerName: workerName || "Unknown Worker",
    groupId: groupId || "no_group_id",
    groupName: groupName || "Unknown Group",
    startTime: startTime || null,
    endTime: new Date().toISOString(),
    durationSeconds,
    production,
    deletedDuringSession: initialItems
      .filter((old) => !items.find((c) => c.id === old.id))
      .map((item) => ({
        itemId: item.id,
        itemName: item.name,
        count: item.count,
      })),
    status, // "completed" | "interrupted"
  };
};
