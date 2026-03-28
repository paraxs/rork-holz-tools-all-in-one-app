import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { FestmeterConfig } from '@/types/festmeter';

interface Props {
  visible: boolean;
  config: FestmeterConfig;
  onSave: (config: FestmeterConfig) => void;
  onClose: () => void;
}

export function FestmeterSettings({ visible, config, onSave, onClose }: Props) {
  const [calculationMethod, setCalculationMethod] = useState<string>(config.calculationMethod);
  const [barkDeductionType, setBarkDeductionType] = useState<string>(config.barkDeductionType);
  const [barkDeductionValue, setBarkDeductionValue] = useState<string>(String(config.barkDeductionValue));

  useEffect(() => {
    setCalculationMethod(config.calculationMethod);
    setBarkDeductionType(config.barkDeductionType);
    setBarkDeductionValue(String(config.barkDeductionValue).replace('.', ','));
  }, [config]);

  const handleSave = () => {
    const newConfig: FestmeterConfig = {
      calculationMethod: calculationMethod as FestmeterConfig['calculationMethod'],
      barkDeductionType: barkDeductionType as FestmeterConfig['barkDeductionType'],
      barkDeductionValue: parseFloat(barkDeductionValue.replace(',', '.')) || 0,
    };
    onSave(newConfig);
    onClose();
  };

  const methods = [
    { key: 'huber_mid', label: 'Huber (Mittendurchmesser)' },
    { key: 'huber_avg_ends', label: 'Huber (Mittel aus D1/D2)' },
    { key: 'smalian', label: 'Smalian (Enddurchmesser D1/D2)' },
  ];

  const barkTypes = [
    { key: 'none', label: 'Kein Abzug' },
    { key: '%', label: '% vom Durchmesser' },
    { key: 'cm', label: 'cm vom Durchmesser' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Einstellungen</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Standard-Berechnungsformel:</Text>
              <View style={styles.options}>
                {methods.map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.option,
                      calculationMethod === method.key && styles.optionActive,
                    ]}
                    onPress={() => setCalculationMethod(method.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        calculationMethod === method.key && styles.optionTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Rindenabzug:</Text>
              <View style={styles.options}>
                {barkTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.option,
                      barkDeductionType === type.key && styles.optionActive,
                    ]}
                    onPress={() => setBarkDeductionType(type.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        barkDeductionType === type.key && styles.optionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(barkDeductionType === '%' || barkDeductionType === 'cm') && (
              <View style={styles.section}>
                <Text style={styles.label}>Wert für Rindenabzug:</Text>
                <TextInput
                  style={styles.input}
                  value={barkDeductionValue}
                  onChangeText={setBarkDeductionValue}
                  placeholder="z.B. 1,5 oder 2"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  options: {
    gap: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});