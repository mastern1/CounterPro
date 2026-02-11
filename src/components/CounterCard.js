import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { TEXTS as appStrings } from "../constants/translations";

const CounterCard = ({
  item,
  onIncrement,
  onDecrement,
  onReset,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showOrderButtons,
  cardWidth, // 👈 نستقبل العرض الذكي من الأب
  containerStyle,
}) => {
  const handleIncrement = () => {
    const targetValue = parseInt(item.target || 0);

    if (targetValue > 0 && item.count >= targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        appStrings.alertError || "Alert",
        "You have reached your goal!",
        [{ text: appStrings.okBtn || "OK", style: "default" }]
      );
      return;
    }

    const stepValue = item.step || 1;
    const nextValue = item.count + stepValue;

    if (targetValue > 0 && nextValue === targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onIncrement(item.id);
  };

  const handleDeleteConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      appStrings.deleteTitle || "Delete",
      appStrings.deleteMessage
        ? appStrings.deleteMessage(item.name)
        : "Delete item?",
      [
        { text: appStrings.cancelBtn || "Cancel", style: "cancel" },
        {
          text: appStrings.deleteBtn || "Delete",
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  const buttonText = `+${item.step || 1}`;

  return (
    <View style={[styles.card, { width: cardWidth }, containerStyle]}>
      {/* --- الهيدر --- */}
      <View
        style={[
          styles.headerRow,
          { justifyContent: showOrderButtons ? "space-between" : "center" },
        ]}
      >
        {/* أزرار الترتيب (يسار) */}
        {showOrderButtons && (
          <View style={styles.orderingContainer}>
            {!isFirst && (
              <TouchableOpacity
                onPress={onMoveUp}
                style={styles.moveBtn}
                hitSlop={10}
              >
                <Ionicons name="chevron-up-circle" size={22} color="#4A90E2" />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                onPress={onMoveDown}
                style={styles.moveBtn}
                hitSlop={10}
              >
                <Ionicons
                  name="chevron-down-circle"
                  size={22}
                  color="#4A90E2"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* أزرار الأدوات (يمين) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={16} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteConfirm}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={16} color="#FF5252" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReset(item.id)}
            style={styles.iconButton}
          >
            <Ionicons name="refresh" size={16} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- الاسم --- */}
      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>

      {/* --- الرقم والهدف --- */}
      <View style={styles.centerSection}>
        <Text style={styles.countText} adjustsFontSizeToFit numberOfLines={1}>
          {item.count}
        </Text>

        {item.target > 0 && (
          <Text
            style={[
              styles.goalText,
              { color: item.count >= item.target ? "#4CAF50" : "#AAA" },
            ]}
          >
            {appStrings.goal || "Goal"}: {item.target}
          </Text>
        )}

        {/* زر الناقص الصغير والأنيق */}
        <TouchableOpacity
          style={styles.minusButtonBelow}
          onPress={() => onDecrement(item.id)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="remove" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* --- زر الزيادة الكبير --- */}
      <TouchableOpacity
        style={[
          styles.incrementButton,
          { backgroundColor: item.color || "#1A73E8" },
        ]}
        onPress={handleIncrement}
        activeOpacity={0.8}
      >
        <Text style={styles.incrementText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

// 🎨 ستايل رشيق ومضغوط (Compact Style)
const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16, // قللنا الانحناء ليصبح شكله "مودرن" أكثر
    paddingVertical: 10, // حشوة رأسية أقل
    paddingHorizontal: 8,
    margin: 4, // هامش صغير جداً بين الكروت (هذا يتوافق مع CARD_MARGIN في الداشبورد)
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 170, // طول مناسب لا هو طويل ولا قصير
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 6,
    height: 24, // ارتفاع ثابت للهيدر لضمان المحاذاة
  },
  orderingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // قللنا المسافة بين الأيقونات لتناسب العرض الصغير
  },
  iconButton: {
    padding: 2,
  },
  title: {
    fontSize: 14, // خط أصغر قليلاً للاسم
    fontWeight: "600",
    color: "#444",
    marginBottom: 2,
    textAlign: "center",
  },
  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    marginBottom: 6,
  },
  countText: {
    fontSize: 48, // حجم رقم كبير لكن مدروس ليناسب المربعات
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 56, // ضبط ارتفاع السطر
  },
  goalText: {
    fontSize: 11,
    marginTop: -4,
    marginBottom: 4,
    fontWeight: "500",
  },
  minusButtonBelow: {
    marginTop: 2,
    width: 32,
    height: 32,
    backgroundColor: "#F2F2F7", // لون خلفية هادئ جداً
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  incrementButton: {
    width: "100%",
    height: 44, // ارتفاع الزر أنيق وليس ضخماً
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  incrementText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default CounterCard;
