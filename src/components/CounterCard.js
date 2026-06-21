import React, { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { TEXTS as appStrings } from "../constants/translations";

// ── 1. Memory constants ─────────────────────────────────────────────
// Hoisting these objects avoids recreating them on every button press.
const HIT_SLOP_SMALL = { top: 10, bottom: 10, left: 10, right: 10 };
const HIT_SLOP_LARGE = { top: 15, bottom: 15, left: 15, right: 15 };
const ACTIVE_OPACITY = 0.8;

const CounterCard = ({
  item,
  index,
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
  // ── Logic ─────────────────────────────────────────────────────────
  const handleIncrement = () => {
    const targetValue = parseInt(item.target || 0);

    // 1. Target check
    if (targetValue > 0 && item.count >= targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        appStrings.alertError || "Alert",
        "You have reached your goal!",
        [{ text: appStrings.okBtn || "OK", style: "default" }],
      );
      return;
    }

    // 2. Haptic feedback
    const stepValue = item.step || 1;
    const nextValue = item.count + stepValue;

    if (targetValue > 0 && nextValue === targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 3. Execute
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

  // Prepare dynamic colors/styles once
  const cardStyle = [
    styles.card,
    { width: cardWidth, backgroundColor: item.color || "#f0f8ff" },
    containerStyle,
  ];
  const goalTextColor = item.count >= item.target ? "#4CAF50" : "#AAA";
  const btnColor = { backgroundColor: "rgba(255, 255, 255, 0.4)" };

  return (
    <View style={cardStyle}>
      {/* ── Header: shown only in List Mode ── */}
      {showOrderButtons && (
        <View style={styles.headerRow}>
          <View style={styles.orderingContainer}>
            {!isFirst && (
              <TouchableOpacity
                onPress={() => onMoveUp(index, "up")}
                style={styles.moveBtn}
                hitSlop={HIT_SLOP_SMALL}
              >
                <Ionicons name="chevron-up-circle" size={20} color="#4A90E2" />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                onPress={() => onMoveDown(index, "down")}
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
        </View>
      )}

      {/* ── Title: tap the settings icon to edit ── */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>
          {item.name}
        </Text>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => onEdit(item)}
          hitSlop={HIT_SLOP_SMALL}
        >
          <Ionicons name="settings-outline" size={14} color="#999" />
        </TouchableOpacity>
      </View>

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

        {/* Decrement button */}
        <TouchableOpacity
          style={styles.minusButtonBelow}
          onPress={() => onDecrement(item.id)}
          hitSlop={HIT_SLOP_LARGE}
        >
          <Ionicons name="remove" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {/* ── Increment Button ── */}
      <TouchableOpacity
        style={[styles.incrementButton, btnColor]}
        onPress={handleIncrement}
        activeOpacity={ACTIVE_OPACITY}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 4,
    gap: 4,
  },
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
  orderingContainer: { flexDirection: "row", gap: 2 },
  actionsContainer: { flexDirection: "row", gap: 10 },
  iconButton: { padding: 2 },
  title: {
    fontSize: 18,
    paddingLeft: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 1,
    textAlign: "center",
    flex: 1,
  },
  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    marginBottom: 4,
  },
  countText: {
    fontSize: 35,
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
  settingsBtn: { alignSelf: "flex-end", padding: 2, marginBottom: 2 },
});

CounterCard.displayName = "CounterCard";

export default memo(CounterCard);
