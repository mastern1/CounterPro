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

// ── 1. ثوابت خارج الكومبوننت (تحسين الأداء) ──────────────────────────
const GAP_SIZE = 8;
const SCREEN_PADDING = 10;
const CARD_MARGIN = 3;
const MIN_CARD_WIDTH = 110; // 👈 الرقم الذهبي للتابلت (4 أعمدة)

// ── 2. ستايلات ثابتة للقوائم ─────────────────────────────────────────
const CONTENT_CONTAINER_STYLE = { padding: SCREEN_PADDING, paddingBottom: 120 };
const GRID_COLUMN_WRAPPER_STYLE = {
  justifyContent: "flex-start",
  gap: GAP_SIZE,
};

// ── 3. مكون القائمة الفارغة (Static) ─────────────────────────────────
const EmptyList = () => (
  <View style={localStyles.emptyContainer}>
    <Text style={localStyles.emptyText}>{TEXTS.noItems}</Text>
    <Text style={localStyles.emptySubText}>{TEXTS.startItemMsg}</Text>
  </View>
);

export default function DashboardScreen({ route, navigation }) {
  // ── Hooks الأساسية ──
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const timerRef = useRef(null); // 👈 ريموت كنترول للتايمر

  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { groups, updateGroup, isGridLayout, toggleLayout, userData } =
    useContext(ProjectContext);
  const { groupId, groupName } = route?.params || {};

  // ── الحسابات والبيانات ──

  // ✅ 1. البحث عن المجموعة (useMemo ضروري هنا)
  const currentGroup = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId],
  );

  // ✅ 2. العناصر (نستخدم useMemo لضمان ثبات عنوان المصفوفة في الذاكرة)
  const items = useMemo(() => currentGroup?.items ?? [], [currentGroup]);
  const { startSession, endSession } = useSessionManager(
    items,
    { id: groupId, name: groupName },
    { name: userData?.name },
  );
  const visibleItems = useMemo(
    () => items.filter((i) => !i.isDeleted),
    [items],
  );

  // ✅ 3. حسابات الشبكة (ثقيلة وتستحق useMemo)
  const { numColumns, dynamicCardWidth } = useMemo(() => {
    const availableWidth = width - SCREEN_PADDING * 2;
    // الحساب بناءً على 135px
    const calculatedColumns = Math.floor(availableWidth / MIN_CARD_WIDTH);
    const cols = isGridLayout ? Math.max(2, calculatedColumns) : 1;

    // توزيع الفراغات بدقة
    const totalGapSpace = (cols - 1) * GAP_SIZE;
    const widthForCards = availableWidth - totalGapSpace;
    const cardWidth = widthForCards / cols - CARD_MARGIN * 2;

    return { numColumns: cols, dynamicCardWidth: cardWidth };
  }, [width, isGridLayout]);

  // ✅ 4. ستايل الصفوف (لتجنب إنشاء كائن جديد كل مرة)
  const columnWrapperStyle = useMemo(
    () => (isGridLayout ? GRID_COLUMN_WRAPPER_STYLE : null),
    [isGridLayout],
  );

  // ── دوال التفاعل (Handlers) ──

  const saveChanges = useCallback(
    (newItems) => {
      if (groupId) updateGroup(groupId, newItems);
    },
    [groupId, updateGroup],
  );

  // ✅ دالة الزيادة (مفصولة ومستقرة)
  const handleIncrement = useCallback(
    (itemId) => {
      const updatedList = items.map((item) => {
        if (item.id !== itemId) return item;
        const step = item.step || 1;
        // شرط الهدف (اختياري، يمكن تفعيله هنا)
        // if (item.target > 0 && item.count >= item.target) return item;
        return { ...item, count: item.count + step };
      });
      saveChanges(updatedList);
    },
    [items, saveChanges],
  );

  // ✅ دالة النقصان (مفصولة ومستقرة)
  const handleDecrement = useCallback(
    (itemId) => {
      const updatedList = items.map((item) => {
        if (item.id !== itemId) return item;
        const step = item.step || 1;
        return { ...item, count: Math.max(0, item.count - step) };
      });
      saveChanges(updatedList);
    },
    [items, saveChanges],
  );

  // ✅ دالة التصفير
  const handleReset = useCallback(
    (itemId) => {
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
      const softDeletedList = items.map((i) =>
        i.id === itemId ? { ...i, isDeleted: true } : i,
      );
      saveChanges(softDeletedList);
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

  // ── المودال (إضافة / تعديل) ──
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
          isDeleted: false,
        };
        updatedList = [newItem, ...items];
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

  // ── 🛡️ حماية الخروج (Navigation Guard) ──
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const isSessionActive = timerRef.current?.isSessionActive();

      if (!isSessionActive) {
        return; // اسمح بالخروج
      }

      // أوقف الخروج
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
              // إيقاف التايمر برمجياً
              timerRef.current?.requestStop();
              // تنفيذ الخروج يدوياً
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation]);

  // ── Render Item (محسن للأداء) ──
  const renderItem = useCallback(
    ({ item, index }) => (
      <CounterCard
        item={item}
        cardWidth={dynamicCardWidth}
        // 👇 هنا نمرر الدوال المفصولة (Wiring الصحيح)
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onReset={handleReset}
        onDelete={handleDelete}
        onEdit={openEditModal}
        onMoveUp={handleMove}
        onMoveDown={handleMove}
        index={index}
        isFirst={index === 0}
        isLast={index === items.length - 1}
        showOrderButtons={!isGridLayout}
      />
    ),
    [
      dynamicCardWidth,
      handleIncrement, // ✅ دالة ثابتة
      handleDecrement, // ✅ دالة ثابتة
      handleReset,
      handleDelete,
      openEditModal,
      handleMove,
      items.length,
      isGridLayout,
    ],
  );

  // ── التحقق من وجود المجموعة ──
  if (!currentGroup) {
    return (
      <View style={[localStyles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={localStyles.errorText}>Group not found!</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={localStyles.backButton}
        >
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── الواجهة الرئيسية ──
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
            <Ionicons
              name={isGridLayout ? "list" : "grid"}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ ربط التايمر بالريموت */}
      <SessionTimer ref={timerRef} onStart={startSession} onStop={endSession} />

      <FlatList
        // ✅ مفتاح لتغيير التخطيط (يمنع مشاكل الأعمدة في أندرويد)
        key={isGridLayout ? `grid-${numColumns}` : "list"}
        data={visibleItems}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={EmptyList}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        columnWrapperStyle={columnWrapperStyle}
        // تحسينات أداء إضافية للقوائم الطويلة
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: COLORS.primary, paddingBottom: 15, elevation: 5 },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  headerInfoContainer: { alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerInfo: { color: "#fff", fontSize: 11, opacity: 0.8, marginBottom: 2 },
  iconButton: { padding: 5 },
  errorText: { fontSize: 18, color: "#666", marginTop: 10 },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#eee",
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
  emptyText: { fontSize: 16, color: "#888", fontWeight: "bold" },
  emptySubText: { fontSize: 13, color: "#aaa", marginTop: 5 },
});
