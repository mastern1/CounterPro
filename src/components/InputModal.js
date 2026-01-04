import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../constants/colors';
import { TEXTS } from '../constants/translations';
import { validateName } from "../utils/validation";

// نفس ألوانك الأصلية
/*const COLORS_PALETTE = [
  '#1A73E8', '#43A047', '#E91E63', '#FF9800', 
  '#8E24AA', '#5D4037', '#546E7A', '#00ACC1'
];*/

const InputModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  title, 
  placeholder,
  // 👇 مفاتيح التحكم (الافتراضي: مغلقة لتكون بسيطة)
  showStep = false,
  showTarget = false, 
  showColor = false,
  initialData = {} // لاستقبال البيانات عند التعديل
}) => {
  
  // States داخلية للموديل
  const [name, setName] = useState('');
  const [step, setStep] = useState('1');
  const [target, setTarget] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS.palette[0]);

  // عند فتح الموديل: ملء البيانات أو التصفير
  useEffect(() => {
    if (visible) {
      setName(initialData.name || '');
      setStep(initialData.step ? String(initialData.step) : '1');
      setTarget(initialData.target ? String(initialData.target) : '');
      setSelectedColor(initialData.color || COLORS.palette[0]);
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    // تحقق من الاسم  
    const nameValidation = validateName(name);
    if (!nameValidation.valid){
       Alert.alert(TEXTS.alertError, nameValidation.error); 
       return;
    }
    

    // تجهيز الحزمة
    const data = {
      name: name.trim(),
      step: showStep ? (parseInt(step) || 1) : 1,
      target: showTarget ? (parseInt(target) || 0) : 0,
      color: showColor ? selectedColor : null
    };

    onSubmit(data); // إرسال البيانات للأب
    handleClose();
  };

  const handleClose = () => {
    // تصفير البيانات عند الإغلاق
    setName('');
    setStep('1');
    setTarget('');
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
          <Text style={[styles.modalTitle, {color:COLORS.primary}]}>{title || "New Item"}</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. الاسم */}
            <Text style={styles.label}>Name:</Text>
            <TextInput 
              style={styles.input} 
              placeholder={placeholder || "e.g. Gloves Size L"} 
              value={name} 
              onChangeText={setName} 
            />
            
            {/* 2. الخطوة (اختياري) */}
            {showStep && (
              <>
                <Text style={styles.label}>Step (Increment):</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="1, 5, 10..." 
                  keyboardType="numeric" 
                  value={step} 
                  onChangeText={setStep} 
                />
              </>
            )}

            {/* 3. الهدف (اختياري) */}
            {showTarget && (
              <>
                <Text style={styles.label}>Target:</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 100..." 
                  keyboardType="numeric" 
                  value={target} 
                  onChangeText={setTarget} 
                />
              </>
            )}

            {/* 4. اللون (اختياري) */}
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
                        selectedColor === color && styles.selectedColorCircle
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalBtn, {backgroundColor: '#eee'}]} 
              onPress={handleClose}
            >
              <Text style={{color: '#333'}}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalBtn, {backgroundColor: COLORS.primary}]} 
              onPress={handleSubmit}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Save</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

// 👇 نفس الستايل الأصلي تماماً (من كودك)
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { textAlign: 'left', marginBottom: 5, fontSize: 14, color: '#666' }, 
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, textAlign: 'left', backgroundColor: '#f9f9f9' }, 
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  colorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, elevation: 2 },
  selectedColorCircle: { borderWidth: 3, borderColor: '#333', transform: [{scale: 1.1}] }
});

export default InputModal;