import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getBillStats, getTodayStats } from '../db/bills';
import { getAllCustomers } from '../db/customers';
import { getAllProducts } from '../db/products';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ total_bills: 0, total_revenue: 0 });
  const [todayStats, setTodayStats] = useState({ today_bills: 0, today_revenue: 0 });
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [billStats, today, customers, products] = await Promise.all([
        getBillStats(),
        getTodayStats(),
        getAllCustomers(),
        getAllProducts(),
      ]);
      setStats(billStats);
      setTodayStats(today);
      setCustomerCount(customers.length);
      setProductCount(products.length);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickActions = [
    { title: 'New Bill', icon: '🧾', desc: 'Create invoice', screen: 'CreateBill', color: '#006064', bg: '#e0f7fa' },
    { title: 'Customers', icon: '👥', desc: 'Manage clients', screen: 'CustomerList', color: '#00695c', bg: '#e0f2f1' },
    { title: 'Products', icon: '🐟', desc: 'Fish & items', screen: 'ProductList', color: '#0277bd', bg: '#e1f5fe' },
    { title: 'Bills', icon: '📋', desc: 'History & filter', screen: 'BillsList', color: '#00838f', bg: '#e0f7fa' },
    { title: 'Reports', icon: '📊', desc: 'Sales analytics', screen: 'Reports', color: '#004d40', bg: '#e0f2f1' },
    { title: 'Settings', icon: '⚙️', desc: 'PIN & config', screen: 'Settings', color: '#37474f', bg: '#eceff1' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006064']} />}
    >
      {/* Hero */}
      <Surface style={styles.heroBanner} elevation={4}>
        <View style={styles.heroContent}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroWelcome}>Welcome to</Text>
            <Text style={styles.heroTitle}>🐟 PCH & COMPANY</Text>
            <Text style={styles.heroSub}>Fresh Fish Billing</Text>
          </View>
          <Image source={require('../../assets/fish_logo.png')} style={styles.heroLogo} resizeMode="contain" />
        </View>
      </Surface>

      {/* Today */}
      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.statsRow}>
        <Surface style={[styles.statCard, { backgroundColor: '#006064' }]} elevation={3}>
          <Text style={styles.statIcon}>🧾</Text>
          <Text style={styles.statValue}>{todayStats.today_bills}</Text>
          <Text style={styles.statLabel}>Bills</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#00695c' }]} elevation={3}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{customerCount}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#0277bd' }]} elevation={3}>
          <Text style={styles.statIcon}>🐟</Text>
          <Text style={styles.statValue}>{productCount}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </Surface>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, idx) => (
          <Card key={idx} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)}>
            <Card.Content style={styles.actionContent}>
              <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: action.color }]}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  content: { padding: 16, paddingBottom: 30 },
  heroBanner: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', backgroundColor: '#006064' },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22 },
  heroLeft: { flex: 1 },
  heroWelcome: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginVertical: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  heroLogo: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#006064', marginTop: 4, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', borderRadius: 16, backgroundColor: '#fff', elevation: 2 },
  actionContent: { alignItems: 'center', paddingVertical: 18 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionIcon: { fontSize: 26 },
  actionTitle: { fontSize: 14, fontWeight: '700' },
  actionDesc: { fontSize: 11, color: '#78909c', marginTop: 2 },
});
