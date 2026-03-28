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
import { BalkenConfig } from '@/types/balken';

interface Props {
  visible: boolean;
  config: BalkenConfig;
  onSave: (config: BalkenConfig) => void;
  onClose: () => void;
}

export function BalkenSettings({ visible, config, onSave, onClose }: Props) {
  const [allowance, setAllowance] = useState<string>(String(config.allowance));
  const [liveCalc, setLiveCalc] = useState<boolean>(config.liveCalc);
  const [dibMode, setDibMode] = useState<string>(config.dibMode);
  const [bark, setBark] = useState<string>(String(config.bark));
  const [volFormula, setVolFormula] = useState<string>(config.volFormula);
  const [taper, setTaper] = useState<string>(String(config.taper));

  useEffect(() => {
    setAllowance(String(config.allowance).replace('.', ','));
    setLiveCalc(config.liveCalc);
    setDibMode(config.dibMode);
    setBark(String(config.bark).replace('.', ','));
    setVolFormula(config.volFormula);
    setTaper(String(config.taper).replace('.', ','));
  }, [config]);

  const handleSave = () => {
    const newConfig: BalkenConfig = {
      allowance: parseFloat(allowance.replace(',', '.')) || 1.0,
      liveCalc,
      dibMode: dibMode as BalkenConfig['dibMode'],
      bark: parseFloat(bark.replace(',', '.')) || 0,
      volFormula: volFormula as BalkenConfig['volFormula'],
      taper: parseFloat(taper.replace(',', '.')) || 1.5,
    };
    onSave(newConfig);
    onClose();
  };

  const dibModes = [
    { key: 'dib', label: 'DIB (innen, ohne Rinde)' },
    { key: 'oob', label: 'OOB (außen, mit Rinde)' },
  ];

  const volFormulas = [
    { key: 'huber', label: 'Huber (D_mid)' },
    { key: 'smalian', label: 'Smalian (mit Konizität)' },
    { key: 'newton', label: 'Newton (mit Konizität)' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Konfiguration</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Zuschlag (cm):</Text>
              <TextInput
                style={styles.input}
                value={allowance}
                onChangeText={setAllowance}
                keyboardType="numeric"
                placeholder="1,0"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Live-Berechnung:</Text>
              <View style={styles.options}>
                <TouchableOpacity
                  style={[styles.option, !liveCalc && styles.optionActive]}
                  onPress={() => setLiveCalc(false)}
                >
                  <Text style={[styles.optionText, !liveCalc && styles.optionTextActive]}>
                    Aus
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, liveCalc && styles.optionActive]}
                  onPress={() => setLiveCalc(true)}
                >
                  <Text style={[styles.optionText, liveCalc && styles.optionTextActive]}>
                    An
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Messung:</Text>
              <View style={styles.options}>
                {dibModes.map((mode) => (
                  <TouchableOpacity
                    key={mode.key}
                    style={[
                      styles.option,
                      dibMode === mode.key && styles.optionActive,
                    ]}
                    onPress={() => setDibMode(mode.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        dibMode === mode.key && styles.optionTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Rindenstärke je Seite (mm):</Text>
              <TextInput
                style={styles.input}
                value={bark}
                onChangeText={setBark}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Volumenformel:</Text>
              <View style={styles.options}>
                {volFormulas.map((formula) => (
                  <TouchableOpacity
                    key={formula.key}
                    style={[
                      styles.option,
                      volFormula === formula.key && styles.optionActive,
                    ]}
                    onPress={() => setVolFormula(formula.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        volFormula === formula.key && styles.optionTextActive,
                      ]}
                    >
                      {formula.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Konizität (cm/m):</Text>
              <TextInput
                style={styles.input}
                value={taper}
                onChangeText={setTaper}
                keyboardType="numeric"
                placeholder="1,5"
              />
            </View>
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  options: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  option: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 100,
  },
  optionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#fff',
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