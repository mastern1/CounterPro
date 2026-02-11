import { Ionicons } from "@expo/vector-icons";
import { useContext, useState } from "react";
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
import CounterCard from "../components/CounterCard";
import InputModal from "../components/InputModal";
import { COLORS } from "../constants/colors";
import { TEXTS } from "../constants/translations";
import { ProjectContext } from "../context/ProjectContext";
import { generateId } from "../utils/generators";
import { checkDuplicateName, validateStep } from "../utils/validation";
import SessionTimer from "../components/SessionTimer";

export default function DashboardScreen({ route, navigation }) {
  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { groups, updateGroup, isGridLayout, toggleLayout, userData } =
    useContext(ProjectContext);
  const { groupId, groupName } = route?.params || {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const currentGroup = groups.find((g) => g.id === groupId);

  if (!currentGroup) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={{ fontSize: 18, color: "#666", marginTop: 10 }}>
          Group not found!
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#eee",
            borderRadius: 8,
          }}
        >
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = currentGroup?.items || [];

  const saveChanges = (newItems) => {
    updateGroup(groupId, newItems);
  };

  // ✅ بالإضافة الجديدة: دالة التحريك (فوق / تحت)
  const handleMove = (index, direction) => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // حماية الحدود (كي لا يخرج عن المصفوفة)
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // عملية التبديل (Swap)
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];

    // حفظ الترتيب الجديد
    saveChanges(newItems);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleModalSubmit = (data) => {
    const { name, step, target, color } = data;

    const duplicateName = checkDuplicateName(name, items, editingItem?.id);

    if (duplicateName) {
      Alert.alert(TEXTS.alertError, "This item name already exists!");
      return;
    }

    let updatedList;

    if (!editingItem) {
      const newItem = {
        id: generateId(),
        name: name,
        count: 0,
        step: validateStep(step),
        target: target,
        color: color,
      };
      updatedList = [newItem, ...items];
    } else {
      updatedList = items.map((item) => {
        if (item.id === editingItem.id) {
          return { ...item, name, step, target, color };
        }
        return item;
      });
    }

    saveChanges(updatedList);
    setModalVisible(false);
  };

  const handleUpdate = (itemId, type) => {
    const updatedList = items.map((item) => {
      if (item.id !== itemId) return item;
      if (type === "inc")
        return { ...item, count: item.count + (item.step || 1) };
      if (type === "dec")
        return { ...item, count: Math.max(0, item.count - (item.step || 1)) };
      return item;
    });

    if (type === "reset") {
      const item = items.find((i) => i.id === itemId);
      Alert.alert(
        TEXTS.resetAlertTitle,
        TEXTS.resetMessage
          ? TEXTS.resetMessage(item.name)
          : TEXTS.resetAlertMsg,
        [
          { text: TEXTS.cancelBtn, style: "cancel" },
          {
            text: TEXTS.confirmBtn,
            onPress: () => {
              const resetList = items.map((i) =>
                i.id === itemId ? { ...i, count: 0 } : i
              );
              saveChanges(resetList);
            },
          },
        ]
      );
      return;
    }
    saveChanges(updatedList);
  };

  const handleDelete = (itemId) => {
    const filteredList = items.filter((i) => i.id !== itemId);
    saveChanges(filteredList);
  };

  // 📏 إعدادات القياسات
  const SCREEN_PADDING = 10; // المسافة الجانبية للشاشة (من الستايل contentContainerStyle)
  const CARD_MARGIN = 4; // المارجن حول الكارت الواحد (لازم يطابق الموجود في CounterCard)
  const MIN_CARD_WIDTH = 145; // أقل عرض مسموح للكارت (عشان الأزرار ما تخرب)

  // 🧮 1. حساب المساحة الصافية المتاحة للكروت
  const availableWidth = width - SCREEN_PADDING * 2;

  // 🧮 2. حساب عدد الأعمدة المناسب (بدون كسور)
  const calculatedColumns = Math.floor(availableWidth / MIN_CARD_WIDTH);

  // في وضع الشبكة: عالأقل عمودين، وفي القائمة: عمود واحد
  const numColumns = isGridLayout ? Math.max(2, calculatedColumns) : 1;

  // 🧮 3. حساب عرض الكارت الواحد لملء الفراغ بالتساوي
  // المعادلة: (المساحة الكلية / عدد الأعمدة) - (هامش الكارت يمين ويسار)
  const dynamicCardWidth = availableWidth / numColumns - CARD_MARGIN * 2;

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
      {/* 2. المؤقت الجديد (الطبقة الوسطى) */}
      <SessionTimer
        onStart={() => console.log("Session Started!")}
        onStop={(duration) => {
          console.log("Session Ended. Duration:", duration);
          // هنا سنضيف لاحقاً كود الحفظ في السجل
        }}
      />

      <FlatList
        key={isGridLayout ? `grid-${numColumns}` : "list"}
        data={items}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        // ✅ التعديل هنا: استقبال index وتمرير دوال التحريك
        renderItem={({ item, index }) => (
          <CounterCard
            item={item}
            cardWidth={dynamicCardWidth}
            onIncrement={() => handleUpdate(item.id, "inc")}
            onDecrement={() => handleUpdate(item.id, "dec")}
            onReset={() => handleUpdate(item.id, "reset")}
            onDelete={() => handleDelete(item.id)}
            onEdit={() => openEditModal(item)}
            // 👇 الإضافات الجديدة الخاصة بالترتيب
            onMoveUp={() => handleMove(index, "up")}
            onMoveDown={() => handleMove(index, "down")}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            showOrderButtons={!isGridLayout} // نخفي الأزرار في وضع الشبكة
          />
        )}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>{TEXTS.noItems}</Text>
            <Text style={localStyles.emptySubText}>{TEXTS.startItemMsg}</Text>
          </View>
        }
        contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
        columnWrapperStyle={
          isGridLayout ? { justifyContent: "flex-start" } : null
        }
      />

      <TouchableOpacity
        style={[localStyles.fab, { backgroundColor: COLORS.secondary }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={30} color="#fff" />
        <Text style={localStyles.fabLabel}>{TEXTS.addItemBtn}</Text>
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
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabLabel: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, color: "#888", fontWeight: "bold" },
  emptySubText: { fontSize: 13, color: "#aaa", marginTop: 5 },
});
