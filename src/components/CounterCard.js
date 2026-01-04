import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 👇 استيراد ملف النصوص
import * as Haptics from 'expo-haptics';
import { TEXTS as appStrings } from '../constants/translations';

const CounterCard = ({ 
  item, 
  onIncrement, 
  onDecrement, 
  onReset, 
  onEdit, 
  onDelete, 
  cardWidth, // 👈 التغيير الوحيد: استقبلنا العرض كـ prop من الأب
  containerStyle 
}) => {
  
  // ❌ قمنا بحذف "المعادلة الذكية" من هنا
  // السبب: الآن الصفحة الرئيسية (Dashboard) هي التي تقرر العرض
  // إذا كانت "قائمة" سترسل عرض كبير، وإذا "شبكة" سترسل عرض صغير.

  const handleIncrement = () => {
    const stepValue = item.step || 1;
    const nextValue = item.count + stepValue;
    const targetValue = parseInt(item.target || 0);

    // اهتزاز الهدف
    if (targetValue > 0 && nextValue >= targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onIncrement(item.id);
  };

  const handleDeleteConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      appStrings.deleteTitle,
      appStrings.deleteMessage(item.name),
      [
        { text: appStrings.cancelBtn, style: "cancel" },
        { text: appStrings.deleteBtn, style: "destructive", onPress: () => onDelete(item.id) }
      ]
    );
  };

  const buttonText = `+${item.step || 1}`;

  return (
    // 👇 هنا يتم تطبيق العرض القادم من الخارج
    <View style={[styles.card, { width: cardWidth }, containerStyle]}>
      
      {/* 1. القمة: أزرار التحكم */}
      <View style={styles.topIconsRow}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
          <Ionicons name="pencil" size={16} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteConfirm} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={16} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReset(item.id)} style={styles.iconButton}>
          <Ionicons name="refresh" size={16} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 2. اسم العداد */}
      <Text style={styles.title} numberOfLines={1}>{item.name}</Text>

      {/* 3. المنطقة الوسطى (الهرمية) */}
      <View style={styles.centerSection}>
        <Text style={styles.countText} adjustsFontSizeToFit numberOfLines={1}>
          {item.count}
        </Text>
        
        {/* عرض الهدف */}
        {item.target > 0 && (
           <Text style={[styles.goalText, { color: item.count >= item.target ? '#4CAF50' : '#AAA' }]}>
             {appStrings.goal}: {item.target}
           </Text>
        )}

        {/* زر الناقص تحت الرقم */}
        <TouchableOpacity 
          style={styles.minusButtonBelow} 
          onPress={() => onDecrement(item.id)}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="remove" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* 4. الزر السفلي */}
      <TouchableOpacity 
        style={[styles.incrementButton, { backgroundColor: item.color || '#1A73E8' }]} 
        onPress={handleIncrement}
        activeOpacity={0.8}
      >
        <Text style={styles.incrementText}>{buttonText}</Text> 
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 6, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    minHeight: 190,
  },
  topIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
    width: '100%',
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    textAlign: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    marginBottom: 8,
  },
  countText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    includeFontPadding: false,
  },
  goalText: {
    fontSize: 10,
    marginTop: -2,
    marginBottom: 4,
    fontWeight: '600',
  },
  minusButtonBelow: {
    marginTop: 4,
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  incrementButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  incrementText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CounterCard;