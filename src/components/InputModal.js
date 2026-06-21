import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { TEXTS } from "../constants/translations";
import { validateName } from "../utils/validation";

const InputModal = ({
  isEditing = false,
  onReset,
  onDelete,
  visible,
  onClose,
  onSubmit,
  title,
  placeholder,
  showStep = false,
  showTarget = false,
  showColor = false,
  initialData = {},
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [step, setStep] = useState(
    initialData?.step ? String(initialData.step) : "1",
  );
  const [target, setTarget] = useState(
    initialData?.target ? String(initialData.target) : "",
  );
  const [selectedColor, setSelectedColor] = useState(
    initialData?.color || COLORS.palette[0],
  );

  const handleSubmit = () => {
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      Alert.alert(TEXTS.alertError, nameValidation.error);
      return;
    }

    const data = {
      name: name.trim(),
      step: showStep ? parseInt(step) || 1 : 1,
      target: showTarget ? parseInt(target) || 0 : 0,
      color: showColor ? selectedColor : null,
    };

    onSubmit(data);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setStep("1");
    setTarget("");
    setSelectedColor(COLORS.palette[0]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title || "New Item"}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Name:</Text>
            <TextInput
              style={styles.input}
              placeholder={placeholder || "e.g. Gloves Size L"}
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />

            {showStep && (
              <>
                <Text style={styles.label}>Step (Increment):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1, 5, 10..."
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={step}
                  onChangeText={setStep}
                />
              </>
            )}

            {showTarget && (
              <>
                <Text style={styles.label}>Target:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 100..."
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={target}
                  onChangeText={setTarget}
                />
              </>
            )}

            {showColor && (
              <>
                <Text style={styles.label}>Color:</Text>
                <View style={styles.colorContainer}>
                  {COLORS.palette.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorCircle,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            {isEditing && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#3A2E1A", marginTop: 8 },
                  ]}
                  onPress={() => {
                    onReset?.();
                    handleClose();
                  }}
                >
                  <Text style={{ color: "#FFB74D", fontWeight: "bold" }}>
                    🔄 Reset
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#3A1F22", marginTop: 8 },
                  ]}
                  onPress={() => {
                    onDelete?.();
                    handleClose();
                  }}
                >
                  <Text style={{ color: "#EF5350", fontWeight: "bold" }}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: COLORS.surfaceAlt }]}
              onPress={handleClose}
            >
              <Text style={{ color: COLORS.textPrimary }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleSubmit}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 25,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.accent,
  },
  label: {
    textAlign: "left",
    marginBottom: 5,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    textAlign: "left",
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.textPrimary,
  },
  modalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    minWidth: "45%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorCircle: { width: 36, height: 36, borderRadius: 18, elevation: 2 },
  selectedColorCircle: {
    borderWidth: 3,
    borderColor: COLORS.white,
    transform: [{ scale: 1.1 }],
  },
});

export default InputModal;
