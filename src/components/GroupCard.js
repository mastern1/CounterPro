import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

const GroupCard = ({ item, onPress, onEdit, onExport, onDelete }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.colorStrip, { backgroundColor: item.color || "#333" }]}
      />

      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          {/* Text fitted for small/older Android screens */}
          <Text style={styles.groupName} numberOfLines={1} adjustsFontSizeToFit>
            {item.name}
          </Text>
          <Text style={styles.subText}>
            {item.items?.length || 0} Counters •{" "}
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US")
              : "—"}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.actionIcon}>✎</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onExport}>
            <Text style={styles.actionIcon}>📥</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(item.id)}
          >
            <Text style={[styles.actionIcon, { color: "#EF5350" }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    height: 85,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
  colorStrip: { width: 6, height: "100%" },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  textContainer: { flex: 1, justifyContent: "center", marginRight: 8 },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "left",
    includeFontPadding: false,
  },
  subText: { fontSize: 12, color: COLORS.textSecondary, textAlign: "left" },
  actionsContainer: { flexDirection: "row", gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: { backgroundColor: "#1E2A4A" },
  deleteButton: { backgroundColor: "#3A1F22" },
  actionIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

GroupCard.displayName = "GroupCard";

export default memo(GroupCard);
