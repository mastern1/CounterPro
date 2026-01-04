import { Ionicons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CounterCard from '../components/CounterCard';
import InputModal from '../components/InputModal'; // ✅ الاستيراد الجديد
import { COLORS } from '../constants/colors';
import { TEXTS } from '../constants/translations';
import { ProjectContext } from '../context/ProjectContext';
import { generateId } from '../utils/generators';
import { checkDuplicateName, validateStep } from '../utils/validation';

export default function DashboardScreen({ route, navigation }) {
  // ✅ حذفنا كل States المدخلات (الاسم، اللون، الهدف..) لأن الموديل يديرها
  const [editingItem, setEditingItem] = useState(null); // نخزن العنصر كاملاً للتعديل
  const [modalVisible, setModalVisible] = useState(false);

  const { groups, updateGroup, isGridLayout, toggleLayout, userData } = useContext(ProjectContext);
  const { groupId, groupName } = route?.params || {}; 
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
   
  const currentGroup = groups.find(g => g.id === groupId);

  // 🛡️ حماية: لو المجموعة غير موجودة
  if (!currentGroup) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={{ fontSize: 18, color: '#666', marginTop: 10 }}>Group not found!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10, backgroundColor: '#eee', borderRadius: 8 }}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const items = currentGroup?.items || []; 

  const saveChanges = (newItems) => {
    updateGroup(groupId, newItems);
  };

  // 🟢 فتح الموديل للإضافة
  const openAddModal = () => {
    setEditingItem(null); // لا يوجد عنصر للتعديل
    setModalVisible(true);
  };

  // 🟠 فتح الموديل للتعديل
  const openEditModal = (item) => {
    setEditingItem(item); // نمرر العنصر كما هو
    setModalVisible(true);
  };

  // 💾 دالة الحفظ (تستلم البيانات جاهزة من الموديل)
  const handleModalSubmit = (data) => {
    const { name, step, target, color } = data;

    const duplicateName = checkDuplicateName(name, items, editingItem?.id);

    if (duplicateName) {
      Alert.alert(TEXTS.alertError, "This item name already exists!");
      return;
    }

    
    let updatedList;

    if (!editingItem) {
      // 🆕 إضافة جديد
      const newItem = { 
        id: generateId(), 
        name: name, 
        count: 0, 
        step: validateStep(step),
        target: target,
        color: color
      };
      updatedList = [newItem, ...items];
    } else {
      // ✏️ تعديل موجود
      updatedList = items.map(item => {
        if (item.id === editingItem.id) {
          return { ...item, name, step, target, color };
        }
        return item;
      });
    }

    saveChanges(updatedList);
    setModalVisible(false);  //نغلق الموديل بعد النجاح
  };

  const handleUpdate = (itemId, type) => {
    const updatedList = items.map(item => {
        if (item.id !== itemId) return item;
        if (type === 'inc') return { ...item, count: item.count + (item.step || 1) };
        if (type === 'dec') return { ...item, count: Math.max(0, item.count - (item.step || 1)) };
        return item; 
    });

    if (type === 'reset') {
       // ... (كود التصفير كما هو) ...
       const item = items.find(i => i.id === itemId);
       Alert.alert(TEXTS.resetAlertTitle, TEXTS.resetMessage ? TEXTS.resetMessage(item.name) : TEXTS.resetAlertMsg, [
           { text: TEXTS.cancelBtn, style: "cancel" },
           { text: TEXTS.confirmBtn, onPress: () => {
               const resetList = items.map(i => i.id === itemId ? { ...i, count: 0 } : i);
               saveChanges(resetList);
             } 
           }
       ]);
       return;
    }
    saveChanges(updatedList);
  };
  
  const handleDelete = (itemId) => {
    
    const filteredList = items.filter(i => i.id !== itemId);
    saveChanges(filteredList);
  };

  const gridColumns = width > 500 ? 4 : 2;
  const numColumns = isGridLayout ? gridColumns : 1;

  return (
    <View style={localStyles.container}>
      {/* Header */}
      <View style={[localStyles.header, { paddingTop: insets.top + 10 }]}>
        <View style={localStyles.headerTopRow}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.iconButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" /> 
           </TouchableOpacity>
           
           <View style={localStyles.headerInfoContainer}>
              <Text style={localStyles.headerInfo}>{userData?.name} | {userData?.deviceId}</Text>
              <Text style={localStyles.headerTitle}>{groupName}</Text>
           </View>
           
           <TouchableOpacity onPress={toggleLayout} style={localStyles.iconButton}>
              <Ionicons name={isGridLayout ? "list" : "grid"} size={26} color="#fff" /> 
           </TouchableOpacity>
        </View>
      </View>

      <FlatList
        key={isGridLayout ? `grid-${numColumns}` : 'list'} 
        data={items} 
        numColumns={numColumns} 
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CounterCard 
            item={item} 
            cardWidth={isGridLayout ? (width / numColumns) - 20 : width - 20}
            onIncrement={() => handleUpdate(item.id, 'inc')}
            onDecrement={() => handleUpdate(item.id, 'dec')}
            onReset={() => handleUpdate(item.id, 'reset')}
            onDelete={() => handleDelete(item.id)}
            onEdit={() => openEditModal(item)}
          />
        )}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
             <Text style={localStyles.emptyText}>{TEXTS.noItems}</Text>
             <Text style={localStyles.emptySubText}>{TEXTS.startItemMsg}</Text>
          </View>
        }
        contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
        columnWrapperStyle={isGridLayout ? {justifyContent: 'flex-start'} : null}
      />

      <TouchableOpacity style={[localStyles.fab, { backgroundColor: COLORS.secondary }]} onPress={openAddModal}>
        <Ionicons name="add" size={30} color="#fff" />
        <Text style={localStyles.fabLabel}>{TEXTS.addItemBtn}</Text>
      </TouchableOpacity>

      {/* 👇 الموديل الجديد (نظيف ومرتب) */}
      <InputModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        title={editingItem ? "Edit Item" : TEXTS.newItemTitle}
        placeholder="e.g. Gloves Size L"
        
        // ⚡ تفعيل كل الميزات
        showStep={true}
        showTarget={true}
        showColor={true}
        
        // 🔄 تمرير البيانات القديمة في حالة التعديل
        initialData={editingItem || {}} 
      />

    </View>
  );
}

// 🎨 Styles (حذفنا كل ستايلات الموديل منها)
const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: COLORS.primary, paddingBottom: 15, elevation: 5 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerInfoContainer: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerInfo: { color: '#fff', fontSize: 11, opacity: 0.8, marginBottom: 2 },
  iconButton: { padding: 5 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8 }, 
  fabLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: 'bold' },
  emptySubText: { fontSize: 13, color: '#aaa', marginTop: 5 },
});