import { Ionicons } from "@expo/vector-icons";
import { useContext, useState, useMemo, useCallback } from "react"; // ✅ إضافة الهوكس
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GroupCard from "../components/GroupCard";
import InputModal from "../components/InputModal";
import { COLORS } from "../constants/colors";
import { TEXTS } from "../constants/translations";
import { ProjectContext } from "../context/ProjectContext";
import { checkDuplicateName } from "../utils/validation";

const HomeScreen = ({ navigation }) => {
  const { groups, addNewGroup, deleteGroup, userData, logoutUser, editGroup } =
    useContext(ProjectContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

  // ✅ 1. تحسين الأداء: حساب المجموع فقط عند تغير المجموعات
  const totalCounts = useMemo(() => {
    return groups
      .filter((g) => !g.isDeleted)
      .reduce((total, group) => {
        const groupTotal = (group.items || [])
          .filter((item) => !item.isDeleted)
          .reduce((gTotal, item) => gTotal + (item.count || 0), 0);
        return total + groupTotal;
      }, 0);
  }, [groups]);

  // ✅ 2. تثبيت الدوال لمنع إعادة رسم الكروت
  const handlePressGroup = useCallback(
    (group) => {
      navigation.navigate("Dashboard", {
        groupId: group.id,
        groupName: group.name,
      });
    },
    [navigation],
  );

  const handleDeleteGroup = useCallback(
    (id) => {
      Alert.alert(TEXTS.deleteGroupTitle, TEXTS.deleteGroupMsg, [
        { text: TEXTS.cancelBtn, style: "cancel" },
        {
          text: TEXTS.deleteBtn,
          style: "destructive",
          onPress: () => deleteGroup(id),
        },
      ]);
    },
    [deleteGroup],
  ); // يعتمد على دالة Context الثابتة

  const handleUpdatedGroup = useCallback(
    (data) => {
      const { name } = data;
      const duplicateName = checkDuplicateName(name, groups, editingGroupId);
      if (duplicateName) {
        Alert.alert(TEXTS.alertError, "This group name already exists!");
        return;
      }
      const trimmedName = name.trim();
      if (editingGroupId === null) {
        addNewGroup(trimmedName);
      } else {
        editGroup(editingGroupId, trimmedName);
      }
      setModalVisible(false);
      setEditingGroupId(null);
    },
    [groups, editingGroupId, addNewGroup, editGroup],
  );

  const handleLogout = () => {
    Alert.alert(TEXTS.logOutTitle, TEXTS.logOutMsg, [
      { text: TEXTS.cancelBtn, style: "cancel" },
      {
        text: TEXTS.logOutBtn,
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          navigation.reset({ index: 0, routes: [{ name: "WorkerIdentity" }] });
        },
      },
    ]);
  };

  // ✅ 3. دالة رسم الكرت (مهمة جداً لـ FlatList)
  const renderItem = useCallback(
    ({ item }) => (
      <GroupCard
        item={item}
        onPress={() => handlePressGroup(item)}
        onEdit={() => {
          setEditingGroupId(item.id);
          setModalVisible(true);
        }}
        onExport={() => Alert.alert(TEXTS.alertError, TEXTS.editFeature)}
        onDelete={() => handleDeleteGroup(item.id)}
      />
    ),
    [handlePressGroup, handleDeleteGroup],
  );

  const visibleGroups = useMemo(
    () => groups.filter((g) => !g.isDeleted),
    [groups],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {TEXTS.greeting} {userData?.name || "Boss"} 👋
          </Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.deviceIdBadge}>
            <Text style={styles.deviceIdText}>
              {userData?.deviceId || "Mobile"}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{visibleGroups.length}</Text>
          <Text style={styles.statLabel}>{TEXTS.statsGroups}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCounts}</Text>
          <Text style={styles.statLabel}>{TEXTS.statsCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{TEXTS.groupsTitle}</Text>

      <FlatList
        data={visibleGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={renderItem} // ✅ استخدام الدالة الثابتة
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#999" }}>{TEXTS.noGroups}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <InputModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingGroupId(null);
        }}
        onSubmit={handleUpdatedGroup}
        title={editingGroupId ? "Edit Group" : TEXTS.newGroupTitle}
        placeholder={TEXTS.newGroupPlaceholder}
        initialData={
          editingGroupId
            ? { name: groups.find((g) => g.id === editingGroupId)?.name }
            : {}
        }
      />
    </SafeAreaView>
  );
};

// ... الستايلات تبقى كما هي ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#333" },
  date: { fontSize: 14, color: "#666", marginTop: 2 },
  deviceIdBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  deviceIdText: { color: "#1a237e", fontWeight: "bold", fontSize: 12 },
  logoutBtn: { padding: 8, backgroundColor: "#FFEBEE", borderRadius: 8 },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#1a237e" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 10,
    color: "#333",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});

export default HomeScreen;
