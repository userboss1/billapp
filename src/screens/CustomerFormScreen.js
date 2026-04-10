import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { createCustomer, updateCustomer } from '../db/customers';

export default function CustomerFormScreen({ route, navigation }) {
  const customer = route.params?.customer;
  const isEditing = !!customer;

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Customer' : 'Add Customer',
    });
  }, []);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (phone && !/^\d{0,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Invalid phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateCustomer(customer.id, name, phone, address);
      } else {
        await createCustomer(name, phone, address);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save customer');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Name *"
        value={name}
        onChangeText={(v) => { setName(v); setErrors(e => ({ ...e, name: null })); }}
        mode="outlined"
        style={styles.input}
        outlineColor="#b2dfdb"
        activeOutlineColor="#006064"
        error={!!errors.name}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <TextInput
        label="Phone"
        value={phone}
        onChangeText={(v) => { setPhone(v); setErrors(e => ({ ...e, phone: null })); }}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
        outlineColor="#b2dfdb"
        activeOutlineColor="#006064"
        error={!!errors.phone}
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      <TextInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        outlineColor="#b2dfdb"
        activeOutlineColor="#006064"
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#006064"
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        {isEditing ? 'Update Customer' : 'Add Customer'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 20 },
  input: { marginBottom: 6, backgroundColor: '#fff' },
  errorText: { color: '#d32f2f', fontSize: 12, marginBottom: 8, marginLeft: 4 },
  button: { marginTop: 20, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
});
