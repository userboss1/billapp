import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Searchbar, Card, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts, deleteProduct, searchProducts } from '../db/products';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      const data = searchQuery
        ? await searchProducts(searchQuery)
        : await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [searchQuery])
  );

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(id);
            loadProducts();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('ProductForm', { product: item })}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>🐟</Text>
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.rate}>₹{Number(item.rate).toFixed(2)} / kg</Text>
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
        placeholder="Search fish & products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor="#006064"
      />
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🐟</Text>
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubText}>Tap + to add fish & products</Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('ProductForm', {})}
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
  icon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#e0f7fa',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  iconText: { fontSize: 24 },
  textInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#212529' },
  rate: { fontSize: 14, color: '#00838f', fontWeight: '700', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 80, padding: 20 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#546e7a' },
  emptySubText: { fontSize: 14, color: '#90a4ae', marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#0277bd', borderRadius: 16 },
});
