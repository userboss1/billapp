import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Vibration, Animated, Image, Dimensions } from 'react-native';
import { Text, Button, Surface, TouchableRipple } from 'react-native-paper';
import { verifyPin, setPin } from '../utils/auth';

const { width } = Dimensions.get('window');
const KEY_SIZE = Math.min(70, (width - 140) / 3);

export default function PinLockScreen({ onUnlock }) {
  const [pin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnims = useRef([0,1,2,3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
  }, []);

  const animateDot = (index) => {
    Animated.sequence([
      Animated.timing(dotAnims[index], { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(dotAnims[index], { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = async (digit) => {
    if (showReset) {
      if (newPin.length < 4) {
        const updated = newPin + digit;
        setNewPin(updated);
        animateDot(updated.length - 1);
        if (updated.length === 4) {
          if (resetStep === 0) {
            setTimeout(() => { setResetStep(1); setNewPin(''); setError(''); }, 200);
          }
        }
      }
      return;
    }

    if (pin.length < 4) {
      const newPinVal = pin + digit;
      setEnteredPin(newPinVal);
      setError('');
      animateDot(newPinVal.length - 1);
      if (newPinVal.length === 4) {
        setTimeout(async () => {
          const result = await verifyPin(newPinVal);
          if (result.valid) {
            if (result.isMaster) {
              setShowReset(true);
              setEnteredPin('');
              setResetStep(0);
              setNewPin('');
            } else {
              onUnlock();
            }
          } else {
            shake();
            setError('Wrong PIN, try again');
            setTimeout(() => setEnteredPin(''), 300);
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (showReset) {
      setNewPin(prev => prev.slice(0, -1));
    } else {
      setEnteredPin(prev => prev.slice(0, -1));
      setError('');
    }
  };

  const handleResetConfirm = async () => {
    if (newPin.length === 4) {
      await setPin(newPin);
      setShowReset(false);
      setEnteredPin('');
      setNewPin('');
      setResetStep(0);
      onUnlock();
    }
  };

  const currentPin = showReset ? newPin : pin;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.topSection, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/fish_logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>PCH & COMPANY</Text>
        <Text style={styles.subtitle}>
          {showReset
            ? resetStep === 0 ? 'Enter New PIN' : 'Confirm New PIN'
            : 'Enter your PIN'}
        </Text>

        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0,1,2,3].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                currentPin.length > i && styles.dotFilled,
                { transform: [{ scale: Animated.add(1, Animated.multiply(dotAnims[i], 0.3)) }] },
              ]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 24 }} />}

        {showReset && resetStep === 1 && newPin.length === 4 && (
          <Button mode="contained" onPress={handleResetConfirm} style={styles.resetBtn} buttonColor="#006064">
            Set New PIN
          </Button>
        )}
      </Animated.View>

      <View style={styles.keypad}>
        {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['', 0, 'del']].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((key, keyIdx) => {
              if (key === '') return <View key={keyIdx} style={{ width: KEY_SIZE, height: KEY_SIZE }} />;
              const isDel = key === 'del';
              return (
                <TouchableRipple
                  key={keyIdx}
                  onPress={() => isDel ? handleDelete() : handlePress(String(key))}
                  style={[styles.key, isDel && styles.delKey]}
                  borderless
                  rippleColor="rgba(0,96,100,0.15)"
                >
                  <Text style={[styles.keyText, isDel && styles.delText]}>
                    {isDel ? '⌫' : key}
                  </Text>
                </TouchableRipple>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fafa',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 30,
  },
  topSection: { alignItems: 'center', paddingHorizontal: 30 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, borderWidth: 3, borderColor: '#b2dfdb',
  },
  logo: { width: 55, height: 55 },
  appName: { fontSize: 24, fontWeight: '800', color: '#006064', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#546e7a', marginTop: 4, marginBottom: 24, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 20 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: '#006064', backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#006064' },
  error: { color: '#d32f2f', marginTop: 10, fontSize: 14, fontWeight: '600', height: 24 },
  resetBtn: { marginTop: 12, borderRadius: 12 },
  keypad: { paddingHorizontal: 40 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginBottom: 14 },
  key: {
    width: KEY_SIZE, height: KEY_SIZE, borderRadius: KEY_SIZE / 2,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#006064', shadowOpacity: 0.1, shadowRadius: 4,
  },
  delKey: { backgroundColor: '#e0f2f1', elevation: 0 },
  keyText: { fontSize: 24, fontWeight: '600', color: '#006064' },
  delText: { fontSize: 20 },
});
