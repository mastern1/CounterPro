import React, { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TEXTS as appStrings } from "../constants/translations";

// ── 1. Memory constants ─────────────────────────────────────────────
// Hoisting these objects avoids recreating them on every button press.
const HIT_SLOP_SMALL = { top: 10, bottom: 10, left: 10, right: 10 };
const HIT_SLOP_LARGE = { top: 15, bottom: 15, left: 15, right: 15 };
const ACTIVE_OPACITY = 0.8;

// Pick black or white text for best contrast on a given hex background.
// Pure & deterministic — safe to call during render (React Compiler friendly).
const getContrastText = (hex) => {
  if (!hex) return "#FFFFFF";
  const c = hex.replace("#", "");
  const full =
    c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Perceived luminance (0–1); bright backgrounds get dark text.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A1A" : "#FFFFFF";
};

const CounterCard = ({
  item,
  index,
  onIncrement,
  onDecrement,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showOrderButtons,
  cardWidth,
  containerStyle,
}) => {
  const buttonText = `+${item.step || 1}`;

  // Prepare dynamic colors/styles once
  const bgColor = item.color || "#f0f8ff";
  const cardStyle = [
    styles.card,
    { width: cardWidth, backgroundColor: bgColor },
    containerStyle,
  ];
  // Text color adapts to the resolved card background so it's never hidden
  const textColor = getContrastText(bgColor);
  const goalTextColor = item.count >= item.target ? "#4CAF50" : textColor;
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
        <Text
          style={[styles.title, { color: textColor }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {item.name}
        </Text>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => onEdit(item)}
          hitSlop={HIT_SLOP_SMALL}
        >
          <Ionicons name="settings-outline" size={14} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* ── Center (Count) ── */}
      <View style={styles.centerSection}>
        <Text
          style={[styles.countText, { color: textColor }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
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
        onPress={() => onIncrement(item.id)}
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
