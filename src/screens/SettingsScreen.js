import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyPin, setPin } from '../utils/auth';

export default function SettingsScreen({ navigation }) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const p1 = await AsyncStorage.getItem('companyPhone1');
      const p2 = await AsyncStorage.getItem('companyPhone2');
      if (p1) setPhone1(p1);
      if (p2) setPhone2(p2);
    };
    loadSettings();
  }, []);

  const handleSavePhones = async () => {
    setLoading(true);
    await AsyncStorage.setItem('companyPhone1', phone1);
    await AsyncStorage.setItem('companyPhone2', phone2);
    Alert.alert('✅ Success', 'Company details saved successfully');
    setLoading(false);
  };

  const handleChangePin = async () => {
    if (!oldPin || oldPin.length !== 4) {
      Alert.alert('Error', 'Enter your current 4-digit PIN');
      return;
    }
    if (!newPin || newPin.length !== 4) {
      Alert.alert('Error', 'New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }

    setLoading(true);
    const result = await verifyPin(oldPin);
    if (!result.valid) {
      Alert.alert('Error', 'Current PIN is incorrect');
      setLoading(false);
      return;
    }

    const success = await setPin(newPin);
    if (success) {
      Alert.alert('✅ Success', 'PIN changed successfully');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      Alert.alert('Error', 'Failed to change PIN');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Change PIN */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🔐 Change PIN</Text>
          <Text style={styles.cardDesc}>Enter your current PIN and set a new one</Text>

          <TextInput
            label="Current PIN"
            value={oldPin}
            onChangeText={setOldPin}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
            outlineColor="#b2dfdb"
            activeOutlineColor="#006064"
          />

          <TextInput
            label="New PIN"
            value={newPin}
            onChangeText={setNewPin}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
            outlineColor="#b2dfdb"
            activeOutlineColor="#006064"
          />

          <TextInput
            label="Confirm New PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
            outlineColor="#b2dfdb"
            activeOutlineColor="#006064"
          />

          <Button
            mode="contained"
            onPress={handleChangePin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#006064"
            contentStyle={styles.buttonContent}
          >
            Change PIN
          </Button>
        </Card.Content>
      </Card>

      {/* Company Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🏢 Company Details</Text>
          <Text style={styles.cardDesc}>Enter your company phone numbers for bills</Text>
          <TextInput
            label="Phone 1 (e.g. Abu: 9544 103020)"
            value={phone1}
            onChangeText={setPhone1}
            mode="outlined"
            style={styles.input}
            outlineColor="#b2dfdb"
            activeOutlineColor="#006064"
          />
          <TextInput
            label="Phone 2 (e.g. Salam: 9947 082407)"
            value={phone2}
            onChangeText={setPhone2}
            mode="outlined"
            style={styles.input}
            outlineColor="#b2dfdb"
            activeOutlineColor="#006064"
          />
          <Button
            mode="contained"
            onPress={handleSavePhones}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#006064"
            contentStyle={styles.buttonContent}
          >
            Save Details
          </Button>
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🐟 About PCH & COMPANY</Text>
          <Divider style={{ marginVertical: 12, backgroundColor: '#b2dfdb' }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App</Text>
            <Text style={styles.infoValue}>PCH & COMPANY</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>Fish Shop Billing</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage</Text>
            <Text style={styles.infoValue}>SQLite (Offline)</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, backgroundColor: '#fff', marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#006064', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#78909c', marginBottom: 16 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: '#78909c' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#37474f' },
});
