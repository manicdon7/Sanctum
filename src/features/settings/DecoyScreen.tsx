import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '@/core/stores/appStore';

export function DecoyScreen() {
  const navigation = useNavigation();
  const lock = useAppStore((s) => s.lock);

  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const handleButtonPress = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value === 'C') {
      setDisplay('0');
      setEquation('');
      setIsCalculated(false);
      return;
    }

    if (value === '=') {
      // Secret escape sequence check: if user types "369=" on the calculator,
      // it exits Decoy screen back to Lock/Room!
      if (equation === '369') {
        lock(); // Lock and exit decoy mode
        return;
      }

      try {
        // Safe evaluation stub
        const cleaned = equation.replace(/x/g, '*').replace(/÷/g, '/');
        // Simple safety evaluation (only numbers and math operators allowed)
        if (/^[0-9+\-*/().\s]+$/.test(cleaned)) {
          const result = Function(`"use strict"; return (${cleaned})`)();
          setDisplay(String(result));
          setEquation(String(result));
          setIsCalculated(true);
        } else {
          setDisplay('Error');
        }
      } catch {
        setDisplay('Error');
      }
      return;
    }

    // Number/operator press
    if (isCalculated) {
      if (['+', '-', 'x', '÷'].includes(value)) {
        setEquation(display + value);
        setDisplay(display + ' ' + value);
      } else {
        setDisplay(value);
        setEquation(value);
      }
      setIsCalculated(false);
    } else {
      if (display === '0' && !['+', '-', 'x', '÷'].includes(value)) {
        setDisplay(value);
        setEquation(value);
      } else {
        setDisplay((prev) => prev + value);
        setEquation((prev) => prev + value);
      }
    }
  };

  const buttons = [
    ['C', '()', '%', '÷'],
    ['7', '8', '9', 'x'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['+/-', '0', '.', '='],
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      
      {/* Display Area */}
      <View style={styles.displayArea}>
        <Text style={styles.equationText} numberOfLines={1}>
          {equation}
        </Text>
        <Text style={styles.displayText} numberOfLines={1}>
          {display}
        </Text>
      </View>

      {/* Button Grid */}
      <View style={styles.buttonGrid}>
        {buttons.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {row.map((btn) => {
              const isOperator = ['÷', 'x', '-', '+', '='].includes(btn);
              const isFunc = ['C', '()', '%'].includes(btn);

              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.button,
                    isOperator && styles.operatorBtn,
                    isFunc && styles.functionBtn,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isOperator && styles.operatorText,
                      isFunc && styles.funcText,
                    ]}
                  >
                    {btn}
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: '#000000', // standard clinical dark calculator
    justifyContent: 'flex-end',
  },
  displayArea: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flex: 1,
  },
  equationText: {
    fontSize: 24,
    color: '#888888',
    marginBottom: 8,
  },
  displayText: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  buttonGrid: {
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorBtn: {
    backgroundColor: '#FF9F0A', // apple style standard calculator
  },
  functionBtn: {
    backgroundColor: '#A5A5A5',
  },
  btnText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  operatorText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  funcText: {
    color: '#000000',
  },
});
