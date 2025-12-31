import React, { useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GroupCard from '../components/GroupCard';
import { ProjectContext } from '../context/ProjectContext';
import { TEXTS } from '../constants/translations';

const HomeScreen = ({ navigation, route }) => {
  const { workerName, deviceId } = route.params || {};
  const { groups, addNewGroup, deleteGroup } = useContext(ProjectContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const totalCounts = groups.reduce((total, group) => {
    const groupTotal = (group.items || []).reduce((gTotal, item) => gTotal + (item.count || 0), 0);
    return total + groupTotal;
  }, 0);

  const handlePressGroup = (group) => {
    navigation.navigate('Dashboard', { 
      groupId: group.id, groupName: group.groupName, workerName, deviceId 
    });
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addNewGroup(newGroupName, workerName, deviceId);
    setNewGroupName('');
    setModalVisible(false);
  };

  const handleDeleteGroup = (id) => {
    Alert.alert(TEXTS.deleteGroupTitle, TEXTS.deleteGroupMsg, [
        { text: TEXTS.cancelBtn, style: 'cancel' },
        { text: TEXTS.deleteBtn, style: 'destructive', onPress: () => deleteGroup(id) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{TEXTS.greeting} {workerName || 'Boss'} 👋</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>
        <View style={styles.deviceIdBadge}><Text style={styles.deviceIdText}>{deviceId}</Text></View>
      </View>

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
      
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GroupCard 
            item={item}
            onPress={() => handlePressGroup(item)}
            onEdit={() => Alert.alert(TEXTS.alertError, TEXTS.editFeature)}
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

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{TEXTS.newGroupTitle}</Text>
            <TextInput
              style={styles.input}
              placeholder={TEXTS.newGroupPlaceholder}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text>{TEXTS.cancelBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddGroup}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{TEXTS.newGroupBtn}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#666', marginTop: 2 },
  deviceIdBadge: { padding: 8, backgroundColor: '#e3f2fd', borderRadius: 8 },
  deviceIdText: { color: '#1a237e', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, color: '#333' },
  // ✅ نقلنا الزر لليمين (right: 20) بدلاً من اليسار
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a237e', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { fontSize: 32, color: '#fff', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  // ✅ محاذاة النص لليسار (textAlign: 'left')
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'left', backgroundColor: '#fafafa' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#1a237e' }
});

export default HomeScreen;