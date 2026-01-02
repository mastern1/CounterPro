import { Ionicons } from '@expo/vector-icons'; // ✅ استيراد الأيقونات
import { useContext, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GroupCard from '../components/GroupCard';
import { TEXTS } from '../constants/translations';
import { ProjectContext } from '../context/ProjectContext';

const HomeScreen = ({ navigation }) => {
  // ❌ لم نعد بحاجة لقراءة route.params
  // ✅ نستورد بيانات المستخدم ودالة الخروج من المخ مباشرة
  const { groups, addNewGroup, deleteGroup, userData, logoutUser, editGroup } = useContext(ProjectContext);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);

  // حساب إجمالي العدادات
  const totalCounts = groups.reduce((total, group) => {
    const groupTotal = (group.items || []).reduce((gTotal, item) => gTotal + (item.count || 0), 0);
    return total + groupTotal;
  }, 0);

  const handlePressGroup = (group) => {
    navigation.navigate('Dashboard', { 
      groupId: group.id, 
      groupName: group.groupName 
      // لم نعد بحاجة لتمرير workerName لأن الداش بورد يقرأه من الكونتكست أيضاً
    });
  };

  /*const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const nameExists = groups.some(i => i.groupName.trim().toLowerCase() === newGroupName.trim().toLowerCase());
    if (nameExists) {
        Alert.alert(TEXTS.alertError, "This group name already exists!"); 
        return;
    }
    addNewGroup(newGroupName);
    setNewGroupName('');
    setModalVisible(false);
  };
  const handleEditGroup = (id) => {
    setModalVisible(true);
    setEditingGroupId(id);
    return;
  };*/

  const handleUpdatedGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName){
      Alert.alert(TEXTS.alertError, "Group name cannot be empty!");
      return;
    }
     const nameExists = groups.some(i => i.groupName.trim().toLowerCase() === trimmedName.toLowerCase() && 
     i.id !== editingGroupId);
    if (nameExists) {
        Alert.alert(TEXTS.alertError, "This group name already exists!"); 
        return;
  }
  if (editingGroupId === null) {
    addNewGroup(trimmedName);
  } else {
    editGroup(editingGroupId, trimmedName);
    setEditingGroupId(null);
  }
    setNewGroupName('');
    setModalVisible(false);
    setEditingGroupId(null);
  };



  const handleDeleteGroup = (id) => {
    Alert.alert(TEXTS.deleteGroupTitle, TEXTS.deleteGroupMsg, [
        { text: TEXTS.cancelBtn, style: 'cancel' },
        { text: TEXTS.deleteBtn, style: 'destructive', onPress: () => deleteGroup(id) }
    ]);
  };

  // ✅ التعامل مع زر الخروج
  // ✅ التعامل مع زر الخروج (التصحيح)
  const handleLogout = () => {
    Alert.alert(
      TEXTS.logOutTitle, // العنوان
      TEXTS.logOutMsg, // الرسالة
      [
        { text: TEXTS.cancelBtn, style: "cancel" },
        { 
          text: TEXTS.logOutBtn, 
          style: "destructive", 
          onPress: async () => {
            // 1. أولاً: ننفذ الحذف من المخ وننتظر حتى ينتهي
            await logoutUser();
            
            // 2. ثانياً: بعد التأكد من الحذف، نوجه المستخدم لشاشة الدخول
            // نستخدم reset لكي نمنع المستخدم من الرجوع للخلف
            navigation.reset({
              index: 0,
              routes: [{ name:'WorkerIdentity' }], // تأكد أن اسم الشاشة في App.js هو 'WorkerIdentity'
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          {/* ✅ قراءة الاسم من الكونتكست */}
          <Text style={styles.greeting}>{TEXTS.greeting} {userData?.name || 'Boss'} 👋</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>

        <View style={styles.headerRight}>
            {/* بادج نوع الجهاز */}
            <View style={styles.deviceIdBadge}>
                <Text style={styles.deviceIdText}>{userData?.deviceId || 'Mobile'}</Text>
            </View>
            
            {/* 🆕 زر الخروج */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
            </TouchableOpacity>
        </View>
      </View>

      {/* --- STATS --- */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{groups.length}</Text>
          <Text style={styles.statLabel}>{TEXTS.statsGroups}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCounts}</Text>
          <Text style={styles.statLabel}>{TEXTS.statsCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{TEXTS.groupsTitle}</Text>
      
      {/* --- LIST --- */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GroupCard 
            item={item}
            onPress={() => handlePressGroup(item)}
            onEdit={() => {setEditingGroupId(item.id); setNewGroupName(item.groupName); setModalVisible(true);}}
            onExport={() => Alert.alert(TEXTS.alertError, TEXTS.editFeature)}
            onDelete={() => handleDeleteGroup(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#999' }}>{TEXTS.noGroups}</Text>
          </View>
        }
      />

      {/* --- FAB (Add Button) --- */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* --- MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{!editingGroupId ? TEXTS.newGroupTitle : "Edit current group"}</Text>
            <TextInput
              style={styles.input}
              placeholder={TEXTS.newGroupPlaceholder}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => {setModalVisible(false); setEditingGroupId(null); setNewGroupName('');}}>
                <Text>{TEXTS.cancelBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleUpdatedGroup}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{!editingGroupId ? TEXTS.newGroupBtn : "Edit"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    marginBottom: 20 
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#666', marginTop: 2 },
  
  deviceIdBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#e3f2fd', borderRadius: 8 },
  deviceIdText: { color: '#1a237e', fontWeight: 'bold', fontSize: 12 },
  
  logoutBtn: {
      padding: 8,
      backgroundColor: '#FFEBEE', // خلفية حمراء فاتحة جداً
      borderRadius: 8,
  },

  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, color: '#333' },
  
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a237e', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'left', backgroundColor: '#fafafa' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#1a237e' }
});

export default HomeScreen;