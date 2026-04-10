import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Card, Chip, Menu, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllCustomerReports, getSalesByDate, getTodayStats, getBillStats } from '../db/bills';
import { getAllCustomers } from '../db/customers';
import { generateCustomerReportPDF, generateDailySalesReportPDF, sharePDF } from '../utils/pdfGenerator';
import { Alert } from 'react-native';

export default function ReportsScreen({ navigation }) {
  const [tab, setTab] = useState('overview');
  const [todayStats, setTodayStats] = useState({ today_bills: 0, today_revenue: 0 });
  const [allStats, setAllStats] = useState({ total_bills: 0, total_revenue: 0 });
  const [customerReports, setCustomerReports] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadData = async () => {
    try {
      const [today, all, customers] = await Promise.all([
        getTodayStats(),
        getBillStats(),
        getAllCustomerReports(),
      ]);
      setTodayStats(today);
      setAllStats(all);
      setCustomerReports(customers);

      // Last 30 days of sales
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const sales = await getSalesByDate(startDate, endDate);
      setDailySales(sales);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'customers', label: '👥 By Customer' },
    { key: 'daily', label: '📅 Daily Sales' },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const exportCustomersPDF = async () => {
    if (customerReports.length === 0) return;
    setPdfLoading(true);
    try {
      const html = generateCustomerReportPDF(customerReports);
      await sharePDF({ html, bill_number: `Customers_Report_${new Date().getTime()}` }, true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
    setPdfLoading(false);
  };

  const exportDailyPDF = async () => {
    if (dailySales.length === 0) return;
    setPdfLoading(true);
    try {
      const html = generateDailySalesReportPDF(dailySales);
      await sharePDF({ html, bill_number: `Daily_Sales_Report_${new Date().getTime()}` }, true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
    setPdfLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <View>
          {/* Today */}
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsRow}>
            <Surface style={[styles.statCard, { backgroundColor: '#006064' }]} elevation={3}>
              <Text style={styles.statEmoji}>🧾</Text>
              <Text style={styles.statValue}>{todayStats.today_bills}</Text>
              <Text style={styles.statLabel}>Bills Today</Text>
            </Surface>
            <Surface style={[styles.statCard, { backgroundColor: '#00838f' }]} elevation={3}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹{Number(todayStats.today_revenue).toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Today's Revenue</Text>
            </Surface>
          </View>

          {/* All Time */}
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.statsRow}>
            <Surface style={[styles.statCard, { backgroundColor: '#004d40' }]} elevation={3}>
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statValue}>{allStats.total_bills}</Text>
              <Text style={styles.statLabel}>Total Bills</Text>
            </Surface>
            <Surface style={[styles.statCard, { backgroundColor: '#01579b' }]} elevation={3}>
              <Text style={styles.statEmoji}>💵</Text>
              <Text style={styles.statValue}>₹{Number(allStats.total_revenue).toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </Surface>
          </View>

          {/* Top Customers */}
          <Text style={styles.sectionTitle}>Top Customers</Text>
          {customerReports.slice(0, 5).map((c, i) => (
            <Card key={c.id} style={styles.customerCard}>
              <Card.Content style={styles.customerRow}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{c.customer_name}</Text>
                  <Text style={styles.customerSub}>{c.total_bills} bills</Text>
                </View>
                <Text style={styles.customerAmount}>₹{Number(c.total_spent).toLocaleString('en-IN')}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* CUSTOMERS TAB */}
      {tab === 'customers' && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer-wise Spending</Text>
            {customerReports.length > 0 && (
              <Button mode="text" icon="file-pdf-box" onPress={exportCustomersPDF} loading={pdfLoading} disabled={pdfLoading} textColor="#006064" compact>Export PDF</Button>
            )}
          </View>
          {customerReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No data yet</Text>
            </View>
          ) : (
            customerReports.map((c, i) => (
              <Card
                key={c.id}
                style={styles.customerCard}
                onPress={() => navigation.navigate('BillsList', { filterCustomerId: c.id, filterCustomerName: c.customer_name })}
              >
                <Card.Content style={styles.customerRow}>
                  <View style={[styles.rank, { backgroundColor: c.total_spent > 0 ? '#006064' : '#90a4ae' }]}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{c.customer_name}</Text>
                    <Text style={styles.customerSub}>
                      {c.total_bills} bill{c.total_bills !== 1 ? 's' : ''}
                      {c.customer_phone ? ` • ${c.customer_phone}` : ''}
                    </Text>
                  </View>
                  <View style={styles.customerRight}>
                    <Text style={styles.customerAmount}>₹{Number(c.total_spent).toLocaleString('en-IN')}</Text>
                    <Text style={styles.viewBills}>View bills →</Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}

      {/* DAILY SALES TAB */}
      {tab === 'daily' && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last 30 Days</Text>
            {dailySales.length > 0 && (
              <Button mode="text" icon="file-pdf-box" onPress={exportDailyPDF} loading={pdfLoading} disabled={pdfLoading} textColor="#006064" compact>Export PDF</Button>
            )}
          </View>
          {dailySales.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No sales data</Text>
            </View>
          ) : (
            dailySales.map((day, i) => (
              <Card
                key={i}
                style={styles.dayCard}
                onPress={() => navigation.navigate('BillsList', { filterDate: day.sale_date })}
              >
                <Card.Content style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayDate}>{formatDate(day.sale_date)}</Text>
                    <Text style={styles.dayBills}>{day.bill_count} bill{day.bill_count !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.dayRight}>
                    <Text style={styles.dayAmount}>₹{Number(day.daily_total).toLocaleString('en-IN')}</Text>
                    {/* Simple bar */}
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { width: `${Math.min(100, (day.daily_total / Math.max(...dailySales.map(d => d.daily_total))) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 16, paddingBottom: 40 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 4, marginBottom: 16, elevation: 2,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#006064' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#78909c' },
  tabTextActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#006064', marginVertical: 0 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  customerCard: { marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1 },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  rank: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#006064',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rankText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#212529' },
  customerSub: { fontSize: 12, color: '#78909c', marginTop: 2 },
  customerRight: { alignItems: 'flex-end' },
  customerAmount: { fontSize: 16, fontWeight: '700', color: '#00838f' },
  viewBills: { fontSize: 11, color: '#006064', marginTop: 2 },
  dayCard: { marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayInfo: { flex: 1 },
  dayDate: { fontSize: 14, fontWeight: '600', color: '#37474f' },
  dayBills: { fontSize: 12, color: '#90a4ae', marginTop: 1 },
  dayRight: { alignItems: 'flex-end', flex: 1 },
  dayAmount: { fontSize: 16, fontWeight: '700', color: '#006064' },
  barContainer: { width: 100, height: 6, backgroundColor: '#e0f2f1', borderRadius: 3, marginTop: 4 },
  bar: { height: 6, backgroundColor: '#006064', borderRadius: 3 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 50, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#90a4ae', fontWeight: '500' },
});
