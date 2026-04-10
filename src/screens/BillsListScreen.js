import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, TextInput as RNTextInput, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Button, Menu, Chip, Surface } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllBills, deleteBill, getBillsFiltered, getUniqueBillCustomers, getBillItems } from '../db/bills';
import { getAllCustomers } from '../db/customers';
import { generateBillsListPDF, sharePDF } from '../utils/pdfGenerator';

export default function BillsListScreen({ route, navigation }) {
  // If navigated from daily sales or reports with a specific date/customer
  const { filterDate, filterCustomerName } = route.params || {};

  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState(filterCustomerName ? { name: filterCustomerName } : null);
  const [filterPartyOnly, setFilterPartyOnly] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState(filterDate || '');
  const [filterEndDate, setFilterEndDate] = useState(filterDate || '');
  const [filterBillNumber, setFilterBillNumber] = useState('');
  const [showFilters, setShowFilters] = useState(!!filterDate || !!filterCustomerName);
  const [customerMenuVisible, setCustomerMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingBill, setDeletingBill] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (filterDate) {
      setFilterStartDate(filterDate);
      setFilterEndDate(filterDate);
      setShowFilters(true);
    }
    if (filterCustomerName) {
      setFilterCustomer({ name: filterCustomerName });
      setShowFilters(true);
    }
  }, [filterDate, filterCustomerName]);

  const loadBills = async () => {
    try {
      const custs = await getUniqueBillCustomers();
      setCustomers(custs);

      const hasFilters = filterCustomer || filterStartDate || filterEndDate || filterPartyOnly || filterBillNumber;
      if (hasFilters) {
        const data = await getBillsFiltered(
          null, // Using name for filtering now
          filterCustomer ? filterCustomer.name : null,
          filterStartDate || null,
          filterEndDate || null,
          filterPartyOnly,
          filterBillNumber || null
        );
        setBills(data);
      } else {
        const data = await getAllBills();
        setBills(data);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [filterCustomer, filterStartDate, filterEndDate, filterPartyOnly, filterBillNumber])
  );

  const openDeleteConfirm = (bill) => {
    setDeletingBill(bill);
    setConfirmText('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    const expectedName = (deletingBill.display_name || '').trim().toLowerCase();
    if (confirmText.trim().toLowerCase() !== expectedName) {
      Alert.alert('Mismatch', `Please type "${deletingBill.display_name}" exactly to confirm deletion.`);
      return;
    }
    await deleteBill(deletingBill.id);
    setDeleteModalVisible(false);
    setDeletingBill(null);
    setConfirmText('');
    loadBills();
  };

  const clearFilters = () => {
    setFilterCustomer(null);
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterPartyOnly(false);
    setFilterBillNumber('');
    navigation.setParams({ filterDate: undefined, filterCustomerName: undefined });
  };

  const handleExportPDF = async () => {
    if (bills.length === 0) return;
    setPdfLoading(true);
    try {
      // Fetch items for the export
      const billsWithItems = await Promise.all(
        bills.map(async (b) => {
          const items = await getBillItems(b.id);
          return { ...b, items };
        })
      );

      let filterDesc = 'All Bills';
      if (filterStartDate && filterEndDate) {
        if (filterStartDate === filterEndDate) filterDesc = `Bills from ${filterStartDate}`;
        else filterDesc = `Bills from ${filterStartDate} to ${filterEndDate}`;
      }
      if (filterCustomer) filterDesc += ` • ${filterCustomer.name}`;
      if (filterPartyOnly) filterDesc += ` • Party Only`;
      
      const html = generateBillsListPDF(billsWithItems, filterDesc, filteredTotal);
      await sharePDF({ html, bill_number: `Report_${new Date().getTime()}` }, true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
    setPdfLoading(false);
  };

  const hasActiveFilters = filterCustomer || filterStartDate || filterEndDate || filterPartyOnly || filterBillNumber;

  const filteredTotal = bills.reduce((sum, b) => sum + (b.final_amount > 0 ? b.final_amount : b.total_amount), 0);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const renderItem = ({ item }) => {
    const amount = item.final_amount > 0 ? item.final_amount : item.total_amount;
    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('BillPreview', { billId: item.id })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <View style={[styles.icon, item.is_party_order && styles.partyIcon]}>
              <Text style={styles.iconText}>{item.is_party_order ? '🎉' : '🧾'}</Text>
            </View>
            <View style={styles.textInfo}>
              <View style={styles.billRow}>
                <Text style={styles.billNumber}>{item.bill_number}</Text>
                {item.is_party_order ? <Chip style={styles.partyChip} textStyle={styles.partyChipText} compact>Party</Chip> : null}
              </View>
              <Text style={styles.customerName}>{item.display_name || 'Unknown'}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.amount}>₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <IconButton
              icon="delete-outline"
              iconColor="#ef5350"
              size={20}
              onPress={() => openDeleteConfirm(item)}
              style={{ margin: 0 }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Button
          mode={showFilters ? 'contained' : 'outlined'}
          icon="filter-variant"
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
          buttonColor={showFilters ? '#006064' : undefined}
          textColor={showFilters ? '#fff' : '#006064'}
          compact
        >
          Filters
        </Button>
        {bills.length > 0 && (
          <Button
            mode="text"
            icon="file-pdf-box"
            onPress={handleExportPDF}
            textColor="#006064"
            loading={pdfLoading}
            disabled={pdfLoading}
            compact
          >
            Export PDF
          </Button>
        )}
      </View>

      {hasActiveFilters && !showFilters && (
        <View style={styles.activeFiltersRow}>
          <Surface style={styles.summaryBadge} elevation={0}>
            <Text style={styles.summaryText}>{bills.length} bills • ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </Surface>
          <Button mode="text" onPress={clearFilters} textColor="#ef5350" compact>
            Clear All
          </Button>
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Surface style={styles.filterPanel} elevation={2}>
          {hasActiveFilters && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Surface style={styles.summaryBadge} elevation={0}>
                <Text style={styles.summaryText}>{bills.length} bills • ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </Surface>
              <Button mode="text" onPress={clearFilters} textColor="#ef5350" compact>
                Clear All
              </Button>
            </View>
          )}

          <Text style={styles.filterLabel}>Invoice Number</Text>
          <RNTextInput
            style={[styles.dateInput, { marginBottom: 16 }]}
            placeholder="Search by invoice number..."
            placeholderTextColor="#90a4ae"
            value={filterBillNumber}
            onChangeText={setFilterBillNumber}
            autoCapitalize="sentences"
          />

          <Text style={styles.filterLabel}>Customer</Text>
          <Menu
            visible={customerMenuVisible}
            onDismiss={() => setCustomerMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setCustomerMenuVisible(true)} style={styles.picker}>
                <Text style={filterCustomer ? styles.pickerText : styles.pickerPlaceholder}>
                  {filterCustomer ? filterCustomer.name : 'All Customers'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item title="All Customers" onPress={() => { setFilterCustomer(null); setCustomerMenuVisible(false); }} />
            {customers.map((c, idx) => (
              <Menu.Item
                key={idx}
                title={c.name}
                onPress={() => { setFilterCustomer(c); setCustomerMenuVisible(false); }}
              />
            ))}
          </Menu>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Date Range</Text>
          <View style={styles.dateRow}>
            <RNTextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#90a4ae"
              value={filterStartDate}
              onChangeText={setFilterStartDate}
            />
            <Text style={styles.dateTo}>to</Text>
            <RNTextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#90a4ae"
              value={filterEndDate}
              onChangeText={setFilterEndDate}
            />
          </View>

          <View style={styles.quickDates}>
            <Chip compact style={styles.dateChip} textStyle={styles.dateChipText}
              onPress={() => {
                const today = new Date().toISOString().split('T')[0];
                setFilterStartDate(today); setFilterEndDate(today);
              }}
            >Today</Chip>
            <Chip compact style={styles.dateChip} textStyle={styles.dateChipText}
              onPress={() => {
                const today = new Date();
                const past = new Date(today); past.setDate(past.getDate() - 2);
                setFilterStartDate(past.toISOString().split('T')[0]);
                setFilterEndDate(today.toISOString().split('T')[0]);
              }}
            >Last 3 Days</Chip>
            <Chip compact style={styles.dateChip} textStyle={styles.dateChipText}
              onPress={() => {
                const today = new Date();
                const past = new Date(today); past.setDate(past.getDate() - 7);
                setFilterStartDate(past.toISOString().split('T')[0]);
                setFilterEndDate(today.toISOString().split('T')[0]);
              }}
            >Last 7 Days</Chip>
            <Chip compact style={styles.dateChip} textStyle={styles.dateChipText}
              onPress={() => {
                const today = new Date();
                const month = new Date(today.getFullYear(), today.getMonth(), 1);
                setFilterStartDate(month.toISOString().split('T')[0]);
                setFilterEndDate(today.toISOString().split('T')[0]);
              }}
            >This Month</Chip>
          </View>

          <Chip
            selected={filterPartyOnly}
            onPress={() => setFilterPartyOnly(!filterPartyOnly)}
            style={[styles.partyFilterChip, filterPartyOnly && styles.partyFilterActive]}
            textStyle={[styles.partyFilterText, filterPartyOnly && { color: '#fff' }]}
            icon={filterPartyOnly ? 'check' : 'party-popper'}
            compact
          >
            Party Orders Only
          </Chip>
        </Surface>
      )}

      <FlatList
        data={bills}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>{hasActiveFilters ? 'No matching bills' : 'No bills yet'}</Text>
            <Text style={styles.emptySubText}>{hasActiveFilters ? 'Try changing your filters' : 'Create your first bill from the Dashboard'}</Text>
          </View>
        }
      />

      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={5}>
            <Text style={styles.modalTitle}>⚠️ Delete Bill</Text>
            <Text style={styles.modalDesc}>
              To delete bill <Text style={{ fontWeight: '700', color: '#006064' }}>{deletingBill?.bill_number}</Text>, type the customer name below:
            </Text>
            <Text style={styles.modalCustomerName}>"{deletingBill?.display_name}"</Text>
            <RNTextInput
              style={styles.modalInput}
              placeholder="Type customer name to confirm..."
              placeholderTextColor="#90a4ae"
              value={confirmText}
              onChangeText={setConfirmText}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => { setDeleteModalVisible(false); setConfirmText(''); }} style={styles.modalBtn}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmDelete}
                style={styles.modalBtn}
                buttonColor="#d32f2f"
                disabled={confirmText.trim().toLowerCase() !== (deletingBill?.display_name || '').trim().toLowerCase()}
              >
                Delete
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingBottom: 0 },
  filterToggle: { borderRadius: 10, borderColor: '#006064' },
  activeFiltersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 10 },
  summaryBadge: { backgroundColor: '#e0f7fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  summaryText: { fontSize: 12, fontWeight: '600', color: '#006064' },
  filterPanel: { margin: 12, marginTop: 8, padding: 14, borderRadius: 14, backgroundColor: '#fff' },
  filterLabel: { fontSize: 12, fontWeight: '700', color: '#006064', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  picker: { backgroundColor: '#f0fafa', borderRadius: 10, borderWidth: 1, borderColor: '#b2dfdb', paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { fontSize: 14, color: '#212529', fontWeight: '500' },
  pickerPlaceholder: { fontSize: 14, color: '#90a4ae' },
  pickerArrow: { fontSize: 12, color: '#90a4ae' },
  menuContent: { backgroundColor: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, backgroundColor: '#f0fafa', borderRadius: 10, borderWidth: 1, borderColor: '#b2dfdb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#212529' },
  dateTo: { fontSize: 13, color: '#78909c' },
  quickDates: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dateChip: { backgroundColor: '#e0f7fa' },
  dateChipText: { fontSize: 11, color: '#006064' },
  partyFilterChip: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#f0fafa', borderWidth: 1, borderColor: '#b2dfdb' },
  partyFilterActive: { backgroundColor: '#006064', borderColor: '#006064' },
  partyFilterText: { fontSize: 12, color: '#006064' },
  list: { padding: 12, paddingBottom: 20 },
  card: { marginBottom: 10, borderRadius: 14, backgroundColor: '#fff', elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  partyIcon: { backgroundColor: '#fff3e0' },
  iconText: { fontSize: 22 },
  textInfo: { flex: 1 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billNumber: { fontSize: 15, fontWeight: '700', color: '#006064' },
  partyChip: { backgroundColor: '#fff3e0', height: 22 },
  partyChipText: { fontSize: 10, color: '#e65100' },
  customerName: { fontSize: 14, color: '#546e7a', marginTop: 1 },
  date: { fontSize: 12, color: '#90a4ae', marginTop: 2 },
  rightSection: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700', color: '#00838f' },
  empty: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#546e7a' },
  emptySubText: { fontSize: 14, color: '#90a4ae', marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#d32f2f', marginBottom: 10 },
  modalDesc: { fontSize: 14, color: '#546e7a', lineHeight: 20, marginBottom: 6 },
  modalCustomerName: { fontSize: 18, fontWeight: '700', color: '#006064', marginBottom: 14, textAlign: 'center' },
  modalInput: { borderWidth: 2, borderColor: '#b2dfdb', borderRadius: 12, padding: 14, fontSize: 16, color: '#212529', backgroundColor: '#f0fafa', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { borderRadius: 10, minWidth: 100 },
});
