import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 1. استلام cardWidth كخاصية (Prop)
export default function CounterCard({ 
  item, 
  cardWidth, 
  onIncrement, 
  onDecrement, 
  onDelete,
  onReset,
  onEdit 
}) {
  return (
    // 2. دمج الستايل الثابت مع العرض الديناميكي المتغير
    <View style={[styles.card, { width: cardWidth }]}>
      
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onReset} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: '#fb8c00' }]}>↺</Text> 
        </TouchableOpacity>

        <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: '#1e88e5' }]}>✎</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: '#e53935' }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>{item.count}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.actionButton} onPress={onDecrement}>
          <Text style={styles.actionText}>-</Text>
        </TouchableOpacity>

        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>+{item.step}</Text>
        </View>

        <TouchableOpacity style={[styles.actionButton, styles.incrementButton]} onPress={onIncrement}>
          <Text style={[styles.actionText, { color: '#fff' }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// الستايلات ثابتة هنا (بدون العرض لأنه متغير)
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 12, margin: 8, elevation: 4, alignItems: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  iconBtn: { padding: 5 },
  iconText: { fontSize: 20, fontWeight: 'bold' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#444' },
  countContainer: { marginVertical: 5 },
  countText: { fontSize: 32, fontWeight: '900', color: '#1a237e' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center' },
  incrementButton: { backgroundColor: '#1a237e' },
  actionText: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  stepBadge: { backgroundColor: '#e8eaf6', paddingHorizontal: 6, borderRadius: 8 },
  stepText: { fontSize: 11, fontWeight: 'bold', color: '#1a237e' },
});