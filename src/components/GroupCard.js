import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GroupCard = ({ 
  item,       // بيانات المجموعة
  onPress,    // ضغط لفتح المجموعة
  onEdit,     // زر تعديل الاسم (قلم) ✏️
  onExport,   // زر تصدير الإكسل (صندوق) 📥
  onDelete    // زر الحذف (سلة) 🗑️
}) => {
  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 1. الشريط اللوني المميز للمجموعة */}
      <View style={[styles.colorStrip, { backgroundColor: item.color || '#333' }]} />

      {/* 2. محتوى الكرت */}
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.subText}>
            {item.items?.length || 0} Counters • {new Date(parseInt(item.id)).toLocaleDateString('en-US')}
          </Text>
        </View>

        {/* 3. أزرار التحكم الجانبية */}
        <View style={styles.actionsContainer}>
          
          {/* زر التعديل */}
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
            <Text style={styles.actionIcon}>✎</Text>
          </TouchableOpacity>

          {/* زر التصدير */}
          <TouchableOpacity style={styles.actionButton} onPress={onExport}>
            <Text style={styles.actionIcon}>📥</Text> 
          </TouchableOpacity>

          {/* زر الحذف */}
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={[styles.actionIcon, {color: '#d32f2f'}]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// الستايلات
const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    height: 85,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  colorStrip: { width: 6, height: '100%' },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  textContainer: { flex: 1, justifyContent: 'center', marginRight: 8 },
  groupName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, textAlign: 'left' },
  subText: { fontSize: 12, color: '#888', textAlign: 'left' },
  actionsContainer: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  editButton: { backgroundColor: '#e3f2fd' },
  deleteButton: { backgroundColor: '#ffebee' },
  actionIcon: { fontSize: 16, color: '#555' }
});

export default GroupCard;