import React, { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { TEXTS as appStrings } from "../constants/translations";

// ── 1. ثوابت الذاكرة (Memory Constants) ─────────────────────────────
// إخراج هذه الكائنات يمنع إنشاءها من جديد عند كل ضغطة زر
const HIT_SLOP_SMALL = { top: 10, bottom: 10, left: 10, right: 10 };
const HIT_SLOP_LARGE = { top: 15, bottom: 15, left: 15, right: 15 };
const ACTIVE_OPACITY = 0.8;
const DEFAULT_COLOR = "#1A73E8";

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
  cardWidth,
  containerStyle,
}) => {
  // ── المنطق (Logic) ────────────────────────────────────────────────
  const handleIncrement = () => {
    const targetValue = parseInt(item.target || 0);

    // 1. فحص الهدف
    if (targetValue > 0 && item.count >= targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        appStrings.alertError || "Alert",
        "You have reached your goal!",
        [{ text: appStrings.okBtn || "OK", style: "default" }],
      );
      return;
    }

    // 2. الاهتزاز
    const stepValue = item.step || 1;
    const nextValue = item.count + stepValue;

    if (targetValue > 0 && nextValue === targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 3. التنفيذ
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
      ],
    );
  };

  const buttonText = `+${item.step || 1}`;

  // تحضير الألوان والستايلات الديناميكية مرة واحدة
  const cardStyle = [
    styles.card,
    { width: cardWidth, backgroundColor: item.color || "#f0f8ff" },
    containerStyle,
  ];
  const goalTextColor = item.count >= item.target ? "#4CAF50" : "#AAA";
  const btnColor = { backgroundColor: "rgba(255, 255, 255, 0.4)" };

  return (
    <View style={cardStyle}>
      {/* ── Header ── */}
      <View
        style={[
          styles.headerRow,
          showOrderButtons ? styles.justifyBetween : styles.justifyCenter,
        ]}
      >
        {showOrderButtons && (
          <View style={styles.orderingContainer}>
            {!isFirst && (
              <TouchableOpacity
                onPress={() => onMoveUp(item.id, "up")}
                style={styles.moveBtn}
                hitSlop={HIT_SLOP_SMALL}
              >
                <Ionicons name="chevron-up-circle" size={20} color="#4A90E2" />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                onPress={() => onMoveDown(item.id, "down")}
                style={styles.moveBtn}
                hitSlop={HIT_SLOP_SMALL}
              >
                <Ionicons
                  name="chevron-down-circle"
                  size={20}
                  color="#4A90E2"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.iconButton}
            hitSlop={HIT_SLOP_SMALL}
          >
            <Ionicons name="pencil" size={12} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteConfirm}
            style={styles.iconButton}
            hitSlop={HIT_SLOP_SMALL}
          >
            <Ionicons name="trash-outline" size={12} color="#FF5252" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReset(item.id)}
            style={styles.iconButton}
            hitSlop={HIT_SLOP_SMALL}
          >
            <Ionicons name="refresh" size={12} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Title ── */}
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {item.name}
      </Text>

      {/* ── Center (Count) ── */}
      <View style={styles.centerSection}>
        <Text style={styles.countText} adjustsFontSizeToFit numberOfLines={1}>
          {item.count}
        </Text>

        {item.target > 0 && (
          <Text style={[styles.goalText, { color: goalTextColor }]}>
            {appStrings.goal || "Goal"}: {item.target}
          </Text>
        )}

        {/* زر الناقص */}
        <TouchableOpacity
          style={styles.minusButtonBelow}
          onPress={() => onDecrement(item.id)}
          hitSlop={HIT_SLOP_LARGE} // ✅ استخدام الثابت
        >
          <Ionicons name="remove" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {/* ── Increment Button ── */}
      <TouchableOpacity
        style={[styles.incrementButton, btnColor]}
        onPress={handleIncrement}
        activeOpacity={ACTIVE_OPACITY} // ✅ استخدام الثابت
      >
        <Text
          style={styles.incrementText}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Styles (Static) ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    margin: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 115,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
    height: 20,
  },
  // ✅ تعريف الـ Alignment كـ ستايل ثابت بدلاً من الشرط داخل الـ JSX
  justifyBetween: { justifyContent: "space-between" },
  justifyCenter: { justifyContent: "center" },

  orderingContainer: { flexDirection: "row", gap: 2 },
  actionsContainer: { flexDirection: "row", gap: 10 },
  iconButton: { padding: 2 },
  title: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    marginBottom: 1,
    textAlign: "center",
    width: "100%",
  },
  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    marginBottom: 4,
  },
  countText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    width: "100%",
  },
  goalText: {
    fontSize: 9,
    marginTop: -2,
    marginBottom: 2,
    fontWeight: "500",
  },
  minusButtonBelow: {
    marginTop: 2,
    width: 24,
    height: 24,
    backgroundColor: "#F0F0F5",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  incrementButton: {
    width: "100%",
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  incrementText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "bold",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

CounterCard.displayName = "CounterCard";

export default memo(CounterCard);
