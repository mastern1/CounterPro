import React, { useState, useContext } from 'react';
import { View, Text, useWindowDimensions, FlatList, TouchableOpacity, Alert, Modal, TextInput, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import CounterCard from '../components/CounterCard';
import { ProjectContext } from '../context/ProjectContext';
import { TEXTS } from '../constants/translations';

export default function DashboardScreen({ route, navigation }) {
  const { groupId, groupName, workerName, deviceId } = route?.params || {}; 
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { groups, updateGroup } = useContext(ProjectContext);
  const currentGroup = groups.find(g => g.id === groupId);
  const [items, setItems] = useState(currentGroup?.items || []); 
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemStep, setNewItemStep] = useState('1');

  const saveChanges = (newItems) => {
    setItems(newItems);
    updateGroup(groupId, newItems);
  };

  const addItem = () => {
    if (!newItemName.trim()) { Alert.alert(TEXTS.alertError, "Name is required"); return; }
    const newItem = { id: Date.now().toString(), name: newItemName, count: 0, step: parseInt(newItemStep) || 1 };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedList = [...items, newItem];
    saveChanges(updatedList);
    setNewItemName(''); setNewItemStep('1'); setItemModalVisible(false);
  };

  const handleUpdate = (itemId, type) => {
    const updatedList = items.map(item => {
        if (item.id !== itemId) return item;
        if (type === 'inc') return { ...item, count: item.count + item.step };
        if (type === 'dec') return { ...item, count: Math.max(0, item.count - item.step) };
        return item; 
    });

    if (type === 'reset') {
        Alert.alert(TEXTS.resetAlertTitle, TEXTS.resetAlertMsg, [
            { text: TEXTS.cancelBtn },
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
    Alert.alert(TEXTS.deleteItemTitle, TEXTS.deleteItemMsg, [
      { text: TEXTS.cancelBtn, style: "cancel" },
      { text: TEXTS.deleteBtn, style: "destructive", onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const filteredList = items.filter(i => i.id !== itemId);
          saveChanges(filteredList);
        } 
      }
    ]);
  };

  const columns = width > 500 ? 4 : 2;

  return (
    <View style={localStyles.container}>
      <View style={[localStyles.header, { paddingTop: insets.top + 10 }]}>
        <View style={localStyles.headerTopRow}>
           {/* ✅ زر الرجوع: أيقونة Arrow Back لليسار */}
           <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" /> 
           </TouchableOpacity>
           <View style={localStyles.headerInfoContainer}>
              <Text style={localStyles.headerInfo}>{workerName} | {deviceId}</Text>
              <Text style={localStyles.headerTitle}>{groupName}</Text>
           </View>
           <View style={{width: 28}} /> 
        </View>
      </View>

      <FlatList
        key={columns} data={items} numColumns={columns} keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CounterCard item={item} cardWidth={(width / columns) - 20}
            onIncrement={() => handleUpdate(item.id, 'inc')}
            onDecrement={() => handleUpdate(item.id, 'dec')}
            onReset={() => handleUpdate(item.id, 'reset')}
            onDelete={() => handleDelete(item.id)}
            onEdit={() => Alert.alert(TEXTS.alertError, TEXTS.editFeature)}
          />
        )}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
             <Text style={localStyles.emptyText}>{TEXTS.noItems}</Text>
             <Text style={localStyles.emptySubText}>{TEXTS.startItemMsg}</Text>
          </View>
        }
        contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
      />

      <TouchableOpacity style={[localStyles.fab, { backgroundColor: '#2e7d32' }]} onPress={() => setItemModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
        <Text style={localStyles.fabLabel}>{TEXTS.addItemBtn}</Text>
      </TouchableOpacity>

      <Modal visible={itemModalVisible} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>{TEXTS.newItemTitle}</Text>
            <Text style={localStyles.label}>{TEXTS.itemName}:</Text>
            <TextInput style={localStyles.input} placeholder="e.g. Gloves Size L" value={newItemName} onChangeText={setNewItemName} />
            <Text style={localStyles.label}>{TEXTS.itemStep}:</Text>
            <TextInput style={localStyles.input} placeholder="1, 5, 10..." keyboardType="numeric" value={newItemStep} onChangeText={setNewItemStep} />
            <View style={localStyles.modalButtons}>
              <TouchableOpacity style={[localStyles.modalBtn, {backgroundColor: '#eee'}]} onPress={() => setItemModalVisible(false)}>
                <Text style={{color: '#333'}}>{TEXTS.cancelBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[localStyles.modalBtn, {backgroundColor: '#1a237e'}]} onPress={addItem}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{TEXTS.addItemBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a237e', paddingBottom: 15, elevation: 5 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerInfoContainer: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerInfo: { color: '#fff', fontSize: 11, opacity: 0.8, marginBottom: 2 },
  backButton: { padding: 5 },
  // ✅ الزر العائم لليمين
  fab: { position: 'absolute', bottom: 30, right: 20, width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8 }, 
  fabLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1a237e' },
  // ✅ محاذاة النصوص لليسار
  label: { textAlign: 'left', marginBottom: 5, fontSize: 14, color: '#666' }, 
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 20, textAlign: 'left', backgroundColor: '#f9f9f9' }, 
  modalButtons: { flexDirection: 'row', gap: 15 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: 'bold' },
  emptySubText: { fontSize: 13, color: '#aaa', marginTop: 5 }
});