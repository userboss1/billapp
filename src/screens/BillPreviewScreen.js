import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBillWithItems } from '../db/bills';
import { sharePDF, printBill } from '../utils/pdfGenerator';

export default function BillPreviewScreen({ route, navigation }) {
  const { billId } = route.params;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  useEffect(() => {
    loadBill();
  }, []);

  const loadBill = async () => {
    try {
      const p1 = await AsyncStorage.getItem('companyPhone1') || '';
      const p2 = await AsyncStorage.getItem('companyPhone2') || '';
      setPhone1(p1);
      setPhone2(p2);

      const data = await getBillWithItems(billId);
      setBill(data);
    } catch (error) {
      console.error('Error loading bill:', error);
      Alert.alert('Error', 'Failed to load bill');
    }
    setLoading(false);
  };

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await sharePDF(bill);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
    setPdfLoading(false);
  };

  const handlePrint = async () => {
    setPdfLoading(true);
    try {
      await printBill(bill);
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print');
    }
    setPdfLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006064" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Bill not found</Text>
      </View>
    );
  }

  const date = new Date(bill.created_at);
  const formattedDate = date.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Invoice Header */}
      <Surface style={styles.header} elevation={0}>
        <Text style={styles.fishEmoji}>🐟</Text>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
        <Text style={styles.businessName}>PCH & COMPANY • Fresh Fish Shop</Text>
        {phone1 || phone2 ? (
          <Text style={styles.businessPhones}>{phone1 && phone2 ? `${phone1}, ${phone2}` : (phone1 || phone2)}</Text>
        ) : null}
      </Surface>

      {/* Bill Info */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.label}>Invoice No</Text>
          <Text style={styles.value}>{bill.bill_number}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{formattedDate}</Text>
        </View>
      </View>

      {bill.is_party_order ? (
        <View style={styles.partyBadge}>
          <Text style={styles.partyBadgeText}>🎉 Party Order</Text>
        </View>
      ) : null}

      <Divider style={styles.divider} />

      {/* Customer */}
      <View style={styles.section}>
        <Text style={styles.label}>Bill To</Text>
        <Text style={styles.customerName}>{bill.display_name || bill.customer_name}</Text>
        {bill.customer_phone ? <Text style={styles.customerDetail}>📞 {bill.customer_phone}</Text> : null}
        {bill.customer_address ? <Text style={styles.customerDetail}>📍 {bill.customer_address}</Text> : null}
      </View>

      <Divider style={styles.divider} />

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.4 }]}>#</Text>
          <Text style={[styles.th, { flex: 2 }]}>Item</Text>
          <Text style={[styles.th, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
        </View>
        {bill.items.map((item, index) => (
          <View key={item.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.td, { flex: 0.4 }]}>{index + 1}</Text>
            <Text style={[styles.td, { flex: 2, fontWeight: '500' }]}>{item.product_name}</Text>
            <Text style={[styles.td, { flex: 0.8, textAlign: 'center' }]}>{item.quantity}</Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>₹{Number(item.rate).toFixed(2)}</Text>
            <Text style={[styles.td, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#006064' }]}>₹{Number(item.total).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Grand Total */}
      <Surface style={styles.totalSection} elevation={0}>
        {bill.discount > 0 ? (
          <View style={{ width: '100%' }}>
            <View style={styles.subtotalRowPreview}>
              <Text style={styles.subtotalLabelPreview}>Subtotal</Text>
              <Text style={styles.subtotalValuePreview}>₹{Number(bill.total_amount).toFixed(2)}</Text>
            </View>
            <View style={styles.subtotalRowPreview}>
              <Text style={styles.discountLabelPreview}>Discount</Text>
              <Text style={styles.discountValuePreview}>-₹{Number(bill.discount).toFixed(2)}</Text>
            </View>
            <Divider style={styles.totalsDividerPreview} />
            <View style={[styles.subtotalRowPreview, { marginBottom: 0, marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{Number(bill.final_amount > 0 ? bill.final_amount : bill.total_amount).toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{Number(bill.final_amount > 0 ? bill.final_amount : bill.total_amount).toFixed(2)}</Text>
          </View>
        )}
      </Surface>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="share-variant"
          onPress={handleShare}
          loading={pdfLoading}
          disabled={pdfLoading}
          style={styles.actionBtn}
          buttonColor="#006064"
          contentStyle={styles.actionBtnContent}
        >
          Export PDF
        </Button>
        <Button
          mode="outlined"
          icon="printer"
          onPress={handlePrint}
          disabled={pdfLoading}
          style={styles.actionBtn}
          textColor="#006064"
          contentStyle={styles.actionBtnContent}
        >
          Print
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#006064', borderRadius: 18, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  fishEmoji: { fontSize: 32, marginBottom: 4 },
  invoiceTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  businessName: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  businessPhones: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  partyBadge: {
    backgroundColor: '#fff3e0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: '#ffe0b2',
  },
  partyBadgeText: { fontSize: 14, fontWeight: '600', color: '#e65100' },
  label: { fontSize: 11, color: '#78909c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#006064' },
  divider: { marginBottom: 16, backgroundColor: '#b2dfdb' },
  section: { marginBottom: 16 },
  customerName: { fontSize: 18, fontWeight: '700', color: '#212529' },
  customerDetail: { fontSize: 14, color: '#546e7a', marginTop: 3 },
  table: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16, elevation: 2 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#006064', paddingHorizontal: 12, paddingVertical: 12,
  },
  th: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e0f2f1',
  },
  tableRowAlt: { backgroundColor: '#f0fafa' },
  td: { fontSize: 14, color: '#37474f' },
  totalSection: {
    backgroundColor: '#e0f7fa', borderRadius: 14, padding: 20, marginBottom: 24,
    borderWidth: 2, borderColor: '#b2dfdb',
  },
  subtotalRowPreview: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subtotalLabelPreview: { fontSize: 13, color: '#78909c' },
  subtotalValuePreview: { fontSize: 14, color: '#37474f', fontWeight: '600' },
  discountLabelPreview: { fontSize: 13, color: '#e53935' },
  discountValuePreview: { fontSize: 14, color: '#e53935', fontWeight: '700' },
  totalsDividerPreview: { backgroundColor: '#b2dfdb', marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#546e7a' },
  totalValue: { fontSize: 28, fontWeight: '800', color: '#006064' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 12, borderColor: '#006064' },
  actionBtnContent: { paddingVertical: 6 },
});
