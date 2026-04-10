import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import DashboardScreen from '../screens/DashboardScreen';
import CustomerListScreen from '../screens/CustomerListScreen';
import CustomerFormScreen from '../screens/CustomerFormScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import CreateBillScreen from '../screens/CreateBillScreen';
import BillPreviewScreen from '../screens/BillPreviewScreen';
import BillsListScreen from '../screens/BillsListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#006064' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: '#f0fafa' },
};

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: '🐟 PCH & COMPANY',
          headerRight: () => (
            <IconButton
              icon="cog"
              iconColor="#fff"
              size={22}
              onPress={() => navigation.navigate('Settings')}
            />
          ),
        })}
      />
      <Stack.Screen name="CustomerList" component={CustomerListScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={{ title: 'Customer' }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: '🐟 Products' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="CreateBill" component={CreateBillScreen} options={{ title: 'New Bill' }} />
      <Stack.Screen name="BillPreview" component={BillPreviewScreen} options={{ title: 'Invoice' }} />
      <Stack.Screen name="BillsList" component={BillsListScreen} options={{ title: 'Bills History' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: '📊 Reports' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
