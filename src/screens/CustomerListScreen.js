import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Searchbar, Card, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllCustomers, deleteCustomer, searchCustomers } from '../db/customers';

export default function CustomerListScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    try {
      const data = searchQuery
        ? await searchCustomers(searchQuery)
        : await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [searchQuery])
  );

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(id);
            loadCustomers();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('CustomerForm', { customer: item })}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.name}>{item.name}</Text>
            {item.phone ? <Text style={styles.sub}>📞 {item.phone}</Text> : null}
            {item.address ? <Text style={styles.sub} numberOfLines={1}>📍 {item.address}</Text> : null}
          </View>
        </View>
        <IconButton
          icon="delete-outline"
          iconColor="#ef5350"
          size={22}
          onPress={() => handleDelete(item.id, item.name)}
        />
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search customers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor="#006064"
      />
      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySubText}>Tap + to add your first customer</Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('CustomerForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fafa' },
  searchbar: { margin: 12, borderRadius: 14, elevation: 2, backgroundColor: '#fff' },
  searchInput: { fontSize: 14 },
  list: { padding: 12, paddingBottom: 80 },
  card: { marginBottom: 10, borderRadius: 14, backgroundColor: '#fff', elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#006064',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  textInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#212529' },
  sub: { fontSize: 13, color: '#78909c', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 80, padding: 20 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#546e7a' },
  emptySubText: { fontSize: 14, color: '#90a4ae', marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#006064', borderRadius: 16 },
});
