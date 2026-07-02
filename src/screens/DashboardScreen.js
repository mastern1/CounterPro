import { Ionicons } from "@expo/vector-icons";
import {
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";

import { useSessionManager } from "../hooks/useSessionManager";
import CounterCard from "../components/CounterCard";
import InputModal from "../components/InputModal";
import SessionTimer from "../components/SessionTimer";
import { COLORS } from "../constants/colors";
import { TEXTS } from "../constants/translations";
import { ProjectContext } from "../context/ProjectContext";
import { generateId } from "../utils/generators";
import { checkDuplicateName, validateStep } from "../utils/validation";
import * as Haptics from "expo-haptics";

// ── 1. Constants outside the component (performance) ─────────────────
const GAP_SIZE = 8;
const SCREEN_PADDING = 10;
const CARD_MARGIN = 3;
const MIN_CARD_WIDTH = 110; // The sweet spot for tablets (4 columns)

// ── 2. Static list styles ────────────────────────────────────────────
const CONTENT_CONTAINER_STYLE = { padding: SCREEN_PADDING, paddingBottom: 120 };
const GRID_COLUMN_WRAPPER_STYLE = {
  justifyContent: "flex-start",
  gap: GAP_SIZE,
};

// ── 3. Empty list component (static) ─────────────────────────────────
const EmptyList = () => (
  <View style={localStyles.emptyContainer}>
    <Text style={localStyles.emptyText}>{TEXTS.noItems}</Text>
    <Text style={localStyles.emptySubText}>{TEXTS.startItemMsg}</Text>
  </View>
);

export default function DashboardScreen({ route, navigation }) {
  // ── Core hooks ──
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const timerRef = useRef(null); // Remote control for the timer

  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { groups, updateGroup, isGridLayout, toggleLayout, userData } =
    useContext(ProjectContext);
  const { groupId, groupName } = route?.params || {};

  // ── Computed data ──

  // 1. Find the group (useMemo is necessary here)
  const currentGroup = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId],
  );

  // 2. Items (useMemo keeps the array reference stable in memory)
  const items = useMemo(() => currentGroup?.items ?? [], [currentGroup]);
  const { startSession, endSession } = useSessionManager(
    items,
    { id: groupId, name: groupName },
    { name: userData?.name },
  );

  // 3. Grid calculations (heavy enough to deserve useMemo)
  const { numColumns, dynamicCardWidth } = useMemo(() => {
    const availableWidth = width - SCREEN_PADDING * 2;
    // Calculation based on MIN_CARD_WIDTH
    const calculatedColumns = Math.floor(availableWidth / MIN_CARD_WIDTH);
    const cols = isGridLayout ? Math.max(2, calculatedColumns) : 1;

    // Distribute the gaps precisely
    const totalGapSpace = (cols - 1) * GAP_SIZE;
    const widthForCards = availableWidth - totalGapSpace;
    const cardWidth = widthForCards / cols - CARD_MARGIN * 2;

    return { numColumns: cols, dynamicCardWidth: cardWidth };
  }, [width, isGridLayout]);

  // 4. Row style (avoid creating a new object each time)
  const columnWrapperStyle = useMemo(
    () => (isGridLayout ? GRID_COLUMN_WRAPPER_STYLE : null),
    [isGridLayout],
  );

  // ── Handlers ──

  const saveChanges = useCallback(
    (newItems) => {
      if (groupId) updateGroup(groupId, newItems);
    },
    [groupId, updateGroup],
  );

  // Increment (separated and stable)
  const handleIncrement = useCallback(
    (itemId) => {
      const isSessionActive = timerRef.current?.isSessionActive();
      if (!isSessionActive) {
        Alert.alert(
          "Session Inactive",
          "Please start the timer before making changes.",
          [{ text: "Cancel", style: "cancel" }],
        );
        return;
      }
      const updatedList = items.map((item) => {
        if (item.id !== itemId) return item;
        const step = item.step || 1;
        // Clamp at the target so a step overshoot can't jump past the goal.
        const newCount =
          item.target > 0
            ? Math.min(item.count + step, item.target)
            : item.count + step;
        return { ...item, count: newCount };
      });
      saveChanges(updatedList);
    },
    [items, saveChanges],
  );

  // Decrement (separated and stable)
  const handleDecrement = useCallback(
    (itemId) => {
      const isSessionActive = timerRef.current?.isSessionActive();
      if (!isSessionActive) {
        Alert.alert(
          "Session Inactive",
          "Please start the timer before making changes.",
          [{ text: "Cancel", style: "cancel" }],
        );
        return;
      }
      const updatedList = items.map((item) => {
        if (item.id !== itemId) return item;
        const step = item.step || 1;
        return { ...item, count: Math.max(0, item.count - step) };
      });
      saveChanges(updatedList);
    },
    [items, saveChanges],
  );

  // Reset
  const handleReset = useCallback(
    (itemId) => {
      const isSessionActive = timerRef.current?.isSessionActive();
      if (!isSessionActive) {
        Alert.alert(
          "Session Inactive",
          "Please start the timer before making changes.",
          [{ text: "Cancel", style: "cancel" }],
        );
        return;
      }
      const item = items.find((i) => i.id === itemId);
      Alert.alert(
        TEXTS.resetAlertTitle,
        TEXTS.resetMessage
          ? TEXTS.resetMessage(item?.name)
          : TEXTS.resetAlertMsg,
        [
          { text: TEXTS.cancelBtn, style: "cancel" },
          {
            text: TEXTS.confirmBtn,
            onPress: () => {
              const resetList = items.map((i) =>
                i.id === itemId ? { ...i, count: 0 } : i,
              );
              saveChanges(resetList);
            },
          },
        ],
      );
    },
    [items, saveChanges],
  );

  const handleDelete = useCallback(
    (itemId) => {
      const isSessionActive = timerRef.current?.isSessionActive();
      if (!isSessionActive) {
        Alert.alert(
          "Session Inactive",
          "Please start the timer before making changes.",
          [{ text: "Cancel", style: "cancel" }],
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        TEXTS.deleteTitle || "Delete",
        TEXTS.deleteMessage
          ? TEXTS.deleteMessage(items.find((i) => i.id === itemId)?.name)
          : "Delete item?",
        [
          { text: TEXTS.cancelBtn || "Cancel", style: "cancel" },
          {
            text: TEXTS.deleteBtn || "Delete",
            style: "destructive",
            onPress: () => {
              const filteredList = items.filter((i) => i.id !== itemId);
              saveChanges(filteredList);
            },
          },
        ],
      );
    },
    [items, saveChanges],
  );

  const handleMove = useCallback(
    (index, direction) => {
      const newItems = [...items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return;
      [newItems[index], newItems[targetIndex]] = [
        newItems[targetIndex],
        newItems[index],
      ];
      saveChanges(newItems);
    },
    [items, saveChanges],
  );

  // ── Modal (add / edit) ──
  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    setModalVisible(true);
  }, []);

  const handleModalSubmit = useCallback(
    (data) => {
      const { name, step, target, color } = data;
      if (checkDuplicateName(name, items, editingItem?.id)) {
        Alert.alert(TEXTS.alertError, "This item name already exists!");
        return;
      }

      let updatedList;
      if (!editingItem) {
        const newItem = {
          id: generateId(),
          name,
          count: 0,
          step: validateStep(step),
          target,
          color,
        };
        updatedList = [...items, newItem];
      } else {
        updatedList = items.map((item) =>
          item.id === editingItem.id
            ? { ...item, name, step, target, color }
            : item,
        );
      }
      saveChanges(updatedList);
      setModalVisible(false);
    },
    [items, editingItem, saveChanges],
  );

  // ── 🛡️ Exit guard (Navigation Guard) ──
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const isSessionActive = timerRef.current?.isSessionActive();

      if (!isSessionActive) {
        return; // Allow leaving
      }

      // Block leaving
      e.preventDefault();

      Alert.alert(
        "Session Active ⚠️",
        "A timer is running. Stop and save before leaving?",
        [
          { text: "Stay", style: "cancel", onPress: () => {} },
          {
            text: "Stop & Leave",
            style: "destructive",
            onPress: () => {
              // Stop the timer programmatically
              timerRef.current?.requestStop();
              // Perform the exit manually
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation]);

  // ── Render Item (performance optimized) ──
  const renderItem = useCallback(
    ({ item, index }) => (
      <CounterCard
        item={item}
        index={index}
        cardWidth={dynamicCardWidth}
        // Pass the separated handlers (correct wiring)
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onReset={handleReset}
        onDelete={handleDelete}
        onEdit={openEditModal}
        onMoveUp={handleMove}
        onMoveDown={handleMove}
        isFirst={index === 0}
        isLast={index === items.length - 1}
        showOrderButtons={!isGridLayout}
      />
    ),
    [
      dynamicCardWidth,
      handleIncrement, // Stable function
      handleDecrement, // Stable function
      handleReset,
      handleDelete,
      openEditModal,
      handleMove,
      items.length,
      isGridLayout,
    ],
  );

  // ── Group existence check ──
  if (!currentGroup) {
    return (
      <View style={[localStyles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={localStyles.errorText}>Group not found!</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={localStyles.backButton}
        >
          <Text style={{ color: COLORS.textPrimary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ──
  return (
    <View style={localStyles.container}>
      <View style={[localStyles.header, { paddingTop: insets.top + 10 }]}>
        <View style={localStyles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={localStyles.iconButton}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={localStyles.headerInfoContainer}>
            <Text style={localStyles.headerInfo}>
              {userData?.name} | {userData?.deviceId}
            </Text>
            <Text style={localStyles.headerTitle}>{groupName}</Text>
          </View>

          <TouchableOpacity
            onPress={toggleLayout}
            style={localStyles.iconButton}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                padding: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "#000", fontSize: 12 }}>
                {isGridLayout ? "List & edit" : "Grid View"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wire the timer to the remote control */}
      <SessionTimer ref={timerRef} onStart={startSession} onStop={endSession} />

      <FlatList
        // Key changes on layout switch (prevents Android column issues)
        key={isGridLayout ? `grid-${numColumns}` : "list"}
        data={items}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={EmptyList}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        columnWrapperStyle={columnWrapperStyle}
        // Extra performance tuning for long lists
        initialNumToRender={12}
        windowSize={5}
      />

      <TouchableOpacity style={localStyles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={30} color="#fff" />
        <Text
          style={localStyles.fabLabel}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
        >
          {TEXTS.addItemBtn}
        </Text>
      </TouchableOpacity>

      <InputModal
        key={editingItem?.id ?? "new"}
        isEditing={!!editingItem}
        onReset={() => handleReset(editingItem?.id)}
        onDelete={() => handleDelete(editingItem?.id)}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        title={editingItem ? "Edit Item" : TEXTS.newItemTitle}
        placeholder="e.g. Gloves Size L"
        showStep={true}
        showTarget={true}
        showColor={true}
        initialData={editingItem || {}}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: { backgroundColor: COLORS.primary, paddingBottom: 15, elevation: 5 },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  headerInfoContainer: { alignItems: "center", left: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerInfo: { color: "#fff", fontSize: 11, opacity: 0.8, marginBottom: 2 },
  iconButton: { padding: 4 },
  errorText: { fontSize: 18, color: COLORS.textSecondary, marginTop: 10 },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    padding: 4,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: "bold" },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 5 },
});
