import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@user_pin';
const DEFAULT_PIN = '1234';
const MASTER_PIN = '9999';

export async function getPin() {
  try {
    const pin = await AsyncStorage.getItem(PIN_KEY);
    if (pin === null) {
      // First launch - set default PIN
      await AsyncStorage.setItem(PIN_KEY, DEFAULT_PIN);
      return DEFAULT_PIN;
    }
    return pin;
  } catch (error) {
    console.error('Error getting PIN:', error);
    return DEFAULT_PIN;
  }
}

export async function setPin(newPin) {
  try {
    await AsyncStorage.setItem(PIN_KEY, newPin);
    return true;
  } catch (error) {
    console.error('Error setting PIN:', error);
    return false;
  }
}

export async function verifyPin(enteredPin) {
  if (isMasterPin(enteredPin)) {
    return { valid: true, isMaster: true };
  }
  const storedPin = await getPin();
  return { valid: enteredPin === storedPin, isMaster: false };
}

export function isMasterPin(pin) {
  return pin === MASTER_PIN;
}
