import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Card, IconButton, Menu, Surface, Switch, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllCustomers } from '../db/customers';
import { getAllProducts } from '../db/products';
import { createBill } from '../db/bills';

const emptyItem = () => ({ productId: null, productName: '', partyName: '', quantity: 1, rate: '', key: Date.now().toString() + Math.random() });

export default function CreateBillScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [items, setItems] = useState([emptyItem()]);
  const [isPartyOrder, setIsPartyOrder] = useState(false);
  const [discount, setDiscount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [customerMenuVisible, setCustomerMenuVisible] = useState(false);
  const [productMenuVisible, setProductMenuVisible] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [custs, prods] = await Promise.all([getAllCustomers(), getAllProducts()]);
      setCustomers(custs);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const selectProduct = (index, product) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productName: product.name,
        rate: String(product.rate),
      };
      return updated;
    });
    setProductMenuVisible(null);
  };

  const getQtyNum = (item) => {
    if (typeof item.quantity === 'number') return item.quantity;
    return parseFloat(item.quantity) || 0;
  };

  const incrementQty = (index) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: getQtyNum(updated[index]) + 0.5 };
      return updated;
    });
  };

  const decrementQty = (index) => {
    setItems(prev => {
      const updated = [...prev];
      const current = getQtyNum(updated[index]);
      if (current > 0.5) {
        updated[index] = { ...updated[index], quantity: current - 0.5 };
      }
      return updated;
    });
  };

  const handleQtyTextChange = (index, text) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: text };
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const getItemTotal = (item) => {
    const qty = getQtyNum(item);
    const rate = parseFloat(item.rate) || 0;
    return qty * rate;
  };

  const subTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subTotal - discountVal);

  const validate = () => {
    if (!isManualCustomer && !selectedCustomer) {
      Alert.alert('Required', 'Please select a customer or switch to manual entry');
      return false;
    }
    if (isManualCustomer && !manualCustomerName.trim()) {
      Alert.alert('Required', 'Please enter customer name');
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName.trim()) {
        Alert.alert('Required', `Item ${i + 1}: Product name is required`);
        return false;
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        Alert.alert('Required', `Item ${i + 1}: Rate must be greater than 0`);
        return false;
      }
      if (getQtyNum(item) <= 0) {
        Alert.alert('Required', `Item ${i + 1}: Quantity must be greater than 0`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const billItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        partyName: isPartyOrder ? (item.partyName || '') : '',
        quantity: getQtyNum(item),
        rate: parseFloat(item.rate),
      }));
      
      const custId = isManualCustomer ? null : selectedCustomer?.id;
      const custName = isManualCustomer ? manualCustomerName.trim() : selectedCustomer?.name;
      
      const { billId } = await createBill(custId, custName, billItems, isPartyOrder, discountVal);
      Alert.alert('✅ Bill Saved', 'Invoice created successfully!', [
        { text: 'View Bill', onPress: () => navigation.replace('BillPreview', { billId }) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.flex1} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Customer Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🧑 Customer</Text>
          <Button 
            mode="text" 
            compact 
            onPress={() => setIsManualCustomer(!isManualCustomer)}
            textColor="#006064"
          >
            {isManualCustomer ? 'Select from list' : 'Type manually'}
          </Button>
        </View>

        {isManualCustomer ? (
        <TextInput
          label="Customer Name"
          value={manualCustomerName}
          onChangeText={setManualCustomerName}
          mode="outlined"
          style={styles.manualInput}
          outlineColor="#b2dfdb"
          activeOutlineColor="#006064"
        />
      ) : (
        <Menu
          visible={customerMenuVisible}
          onDismiss={() => setCustomerMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setCustomerMenuVisible(true)} style={styles.picker}>
              <Text style={selectedCustomer ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedCustomer ? `${selectedCustomer.name}${selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ''}` : 'Tap to select customer...'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          {customers.length === 0 ? (
            <Menu.Item title="No customers yet" disabled />
          ) : (
            customers.map(c => (
              <Menu.Item
                key={c.id}
                title={c.name}
                description={c.phone || ''}
                onPress={() => { setSelectedCustomer(c); setCustomerMenuVisible(false); }}
              />
            ))
          )}
        </Menu>
      )}

      {/* Party Order Toggle */}
      <Surface style={styles.partyToggle} elevation={0}>
        <View style={styles.partyToggleLeft}>
          <Text style={styles.partyIcon}>🎉</Text>
          <View>
            <Text style={styles.partyLabel}>Party Order</Text>
            <Text style={styles.partyDesc}>Mark as bulk/party order</Text>
          </View>
        </View>
        <Switch value={isPartyOrder} onValueChange={setIsPartyOrder} color="#006064" />
      </Surface>

      {/* Items */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>🐟 Items</Text>
      {items.map((item, index) => (
        <Card key={item.key} style={styles.itemCard}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemLabel}>Item {index + 1}</Text>
              {items.length > 1 && (
                <IconButton icon="close-circle" iconColor="#ef5350" size={22} onPress={() => removeItem(index)} style={{ margin: 0 }} />
              )}
            </View>

            {/* Product Picker */}
            <Menu
              visible={productMenuVisible === index}
              onDismiss={() => setProductMenuVisible(null)}
              anchor={
                <TouchableOpacity onPress={() => setProductMenuVisible(index)} style={styles.productPicker}>
                  <Text style={item.productName ? styles.pickerText : styles.pickerPlaceholder}>
                    {item.productName || 'Select fish/product...'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}
            >
              {products.length === 0 ? (
                <Menu.Item title="No products" disabled />
              ) : (
                products.map(p => (
                  <Menu.Item
                    key={p.id}
                    title={p.name}
                    description={`₹${Number(p.rate).toFixed(2)}/kg`}
                    onPress={() => selectProduct(index, p)}
                  />
                ))
              )}
            </Menu>

            {/* Custom name */}
            <TextInput
              label="Product Name"
              value={item.productName}
              onChangeText={v => updateItem(index, 'productName', v)}
              mode="outlined"
              dense
              style={styles.itemInput}
              outlineColor="#b2dfdb"
              activeOutlineColor="#006064"
            />

            {isPartyOrder && (
              <TextInput
                label="Party Name (e.g. KFT MALPE)"
                value={item.partyName}
                onChangeText={v => updateItem(index, 'partyName', v)}
                mode="outlined"
                dense
                style={styles.itemInput}
                outlineColor="#b2dfdb"
                activeOutlineColor="#006064"
              />
            )}

            {/* Quantity and Rate */}
            <View style={styles.qtyRateRow}>
              <View style={styles.qtySection}>
                <Text style={styles.fieldLabel}>Quantity (kg)</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => decrementQty(index)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <RNTextInput
                    style={styles.qtyInput}
                    value={String(typeof item.quantity === 'number' ? item.quantity : item.quantity)}
                    onChangeText={(text) => handleQtyTextChange(index, text)}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={() => incrementQty(index)} style={[styles.qtyBtn, styles.qtyBtnPlus]}>
                    <Text style={[styles.qtyBtnText, styles.qtyBtnPlusText]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rateSection}>
                <TextInput
                  label="Rate (₹/kg)"
                  value={item.rate}
                  onChangeText={v => updateItem(index, 'rate', v)}
                  mode="outlined"
                  dense
                  keyboardType="decimal-pad"
                  style={styles.rateInput}
                  outlineColor="#b2dfdb"
                  activeOutlineColor="#006064"
                />
              </View>
            </View>

            {/* Item Total */}
            <Surface style={styles.itemTotal} elevation={0}>
              <Text style={styles.itemTotalLabel}>Item Total</Text>
              <Text style={styles.itemTotalValue}>₹{getItemTotal(item).toFixed(2)}</Text>
            </Surface>
          </Card.Content>
        </Card>
      ))}

      <Button mode="outlined" onPress={addItem} icon="plus" style={styles.addItemBtn} textColor="#006064">
        Add Another Item
      </Button>

      {/* Discount & Totals Section */}
      <Surface style={styles.totalsContainer} elevation={4}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal ({items.length} items)</Text>
          <Text style={styles.subtotalValue}>₹{subTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.discountRow}>
          <Text style={styles.discountLabel}>Discount (Cash)</Text>
          <View style={styles.discountInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <RNTextInput
              style={styles.discountInput}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#90a4ae"
            />
          </View>
        </View>

        <Divider style={styles.totalsDivider} />

        <View style={styles.grandTotalRow}>
          <View>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            {isPartyOrder ? <Text style={styles.grandTotalParty}>🎉 Party Order</Text> : null}
          </View>
          <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      </Surface>

      {/* Save */}
      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        icon="check-circle"
        style={styles.saveBtn}
        buttonColor="#006064"
        contentStyle={styles.saveBtnContent}
        labelStyle={styles.saveBtnLabel}
      >
        Save Bill
      </Button>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 16, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#006064' },
  picker: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#b2dfdb',
    paddingHorizontal: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 15, color: '#212529', fontWeight: '500' },
  pickerPlaceholder: { fontSize: 15, color: '#90a4ae' },
  pickerArrow: { fontSize: 12, color: '#90a4ae' },
  menuContent: { backgroundColor: '#fff' },
  manualInput: { backgroundColor: '#fff', fontSize: 15 },
  flex1: { flex: 1 },
  addMemberBtn: { justifyContent: 'center', marginTop: 4 },
  partyContainer: { marginBottom: 4 },
  partyInputRow: { flexDirection: 'row', alignItems: 'center' },
  partyChipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  partyChipWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f7fa', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#006064'
  },
  partyChipLabel: { color: '#006064', fontWeight: '600', marginRight: 6, fontSize: 14 },
  partyChipClose: { color: '#ef5350', fontSize: 20, fontWeight: '700', marginTop: -2, paddingHorizontal: 4 },
  partyToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#b2dfdb',
  },
  partyToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partyIcon: { fontSize: 28 },
  partyLabel: { fontSize: 15, fontWeight: '600', color: '#37474f' },
  partyDesc: { fontSize: 12, color: '#90a4ae' },
  productPicker: {
    backgroundColor: '#f0fafa', borderRadius: 10, borderWidth: 1, borderColor: '#b2dfdb',
    paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  itemCard: { marginBottom: 14, borderRadius: 16, backgroundColor: '#fff', elevation: 2 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#006064',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  itemBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#546e7a' },
  itemInput: { backgroundColor: '#fff', marginBottom: 10 },
  qtyRateRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  qtySection: { flex: 1.2 },
  fieldLabel: { fontSize: 12, color: '#78909c', fontWeight: '600', marginBottom: 6 },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  qtyBtn: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyBtnPlus: { backgroundColor: '#006064' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#006064' },
  qtyBtnPlusText: { color: '#fff' },
  qtyInput: {
    flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700',
    color: '#006064', backgroundColor: '#fff', height: 46, paddingHorizontal: 4,
  },
  rateSection: { flex: 1, justifyContent: 'flex-end' },
  rateInput: { backgroundColor: '#fff' },
  itemTotal: {
    backgroundColor: '#e0f7fa', borderRadius: 10, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemTotalLabel: { fontSize: 13, color: '#546e7a', fontWeight: '600' },
  itemTotalValue: { fontSize: 18, fontWeight: '800', color: '#006064' },
  addItemBtn: { marginTop: 4, marginBottom: 20, borderColor: '#006064', borderRadius: 12 },
  
  totalsContainer: { backgroundColor: '#006064', borderRadius: 18, padding: 20, marginBottom: 16 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  subtotalValue: { fontSize: 16, color: '#e0f7fa', fontWeight: '600' },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  discountLabel: { fontSize: 14, color: '#b2dfdb', fontWeight: '600' },
  discountInputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 12, width: 120,
  },
  currencySymbol: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 4 },
  discountInput: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', height: 40 },
  totalsDivider: { backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  grandTotalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  grandTotalParty: { fontSize: 11, color: '#ffe0b2', marginTop: 2, fontWeight: '600' },
  grandTotalValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  
  saveBtn: { borderRadius: 14, marginBottom: 20 },
  saveBtnContent: { paddingVertical: 8 },
  saveBtnLabel: { fontSize: 18, fontWeight: '700' },
});
