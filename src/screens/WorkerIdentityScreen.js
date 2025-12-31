import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TEXTS } from '../constants/translations'; // استيراد النصوص

const WorkerIdentityScreen = ({ navigation }) => {
  const [workerName, setWorkerName] = useState('');
  const deviceId = Platform.OS === 'ios' ? 'iPhone' : 'Android'; 

  const handleStartWork = () => {
    if (workerName.trim().length === 0) {
      Alert.alert(TEXTS.alertError, TEXTS.alertName);
      return;
    }
    navigation.replace('Home', { workerName, deviceId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📦</Text>
          <Text style={styles.appName}>{TEXTS.welcomeTitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{TEXTS.welcomeUser}</Text>
          <Text style={styles.subLabel}>{TEXTS.enterName}</Text>

          <TextInput
            style={styles.input}
            placeholder={TEXTS.namePlaceholder}
            value={workerName}
            onChangeText={setWorkerName}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.button} onPress={handleStartWork}>
            <Text style={styles.buttonText}>{TEXTS.startButton}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>Beta v1.0 | {deviceId}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a237e' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 60, marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 30, elevation: 10 },
  label: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'center' },
  subLabel: { fontSize: 14, color: '#666', marginBottom: 25, textAlign: 'center' },
  // ✅ التغيير هنا: Text Align Center ليناسب اللغتين
  input: { 
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, fontSize: 16, 
    textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#eee' 
  },
  button: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerText: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 30, fontSize: 12 }
});

export default WorkerIdentityScreen;