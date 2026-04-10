import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { createProduct, updateProduct } from '../db/products';

export default function ProductFormScreen({ route, navigation }) {
  const product = route.params?.product;
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [rate, setRate] = useState(product ? String(product.rate) : '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Product' : 'Add Fish/Product',
    });
  }, []);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!rate.trim()) errs.rate = 'Rate is required';
    else if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) errs.rate = 'Enter a valid rate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateProduct(product.id, name, parseFloat(rate));
      } else {
        await createProduct(name, parseFloat(rate));
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Fish / Product Name *"
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
        label="Rate (₹ per kg) *"
        value={rate}
        onChangeText={(v) => { setRate(v); setErrors(e => ({ ...e, rate: null })); }}
        mode="outlined"
        style={styles.input}
        keyboardType="decimal-pad"
        outlineColor="#b2dfdb"
        activeOutlineColor="#006064"
        error={!!errors.rate}
      />
      {errors.rate && <Text style={styles.errorText}>{errors.rate}</Text>}

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
        {isEditing ? 'Update Product' : 'Add Product'}
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
