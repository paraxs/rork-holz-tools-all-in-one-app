import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Settings, Trash2, Download, Calculator } from 'lucide-react-native';
import { BalkenProvider, useBalken } from '@/hooks/balken-store';
import { BalkenLog } from '@/types/balken';
import { BalkenTable } from '@/components/BalkenTable';
import { BalkenSettings } from '@/components/BalkenSettings';
import { BalkenVisualization } from '@/components/BalkenVisualization';

function BalkenScreen() {
  const {
    logs,
    config,
    addLog,
    updateLog,
    deleteLog,
    clearAllLogs,
    updateConfig,
    exportToCSV,
  } = useBalken();

  const [postType, setPostType] = useState<string>('custom');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const postPresets: Record<string, [number, number]> = {
    '10x10': [10, 10],
    '12x12': [12, 12],
    '15x15': [15, 15],
    '16x16': [16, 16],
    '16x20': [16, 20],
    '20x20': [20, 20],
    '25x25': [25, 25],
    '30x30': [30, 30],
  };

  const getPostDimensions = (): [number, number] | null => {
    if (postType === 'custom') {
      const w = parseFloat(customWidth.replace(',', '.'));
      const h = parseFloat(customHeight.replace(',', '.'));
      return w > 0 && h > 0 ? [w, h] : null;
    }
    return postPresets[postType] || null;
  };

  const calculateMinDiameter = (dims: [number, number]): number => {
    const [w, h] = dims;
    return Math.sqrt(w * w + h * h) + config.allowance;
  };

  const toDIB = (diameter: number): number => {
    if (config.dibMode === 'oob') {
      return Math.max(0, diameter - 2 * (config.bark / 10));
    }
    return diameter;
  };

  const calculateVolume = (diameter: number, length: number): number => {
    const d_mid = toDIB(diameter);
    if (d_mid <= 0 || length <= 0) return 0;

    const taper = config.taper;
    const d_small = Math.max(0, d_mid - taper * (length / 2));
    const d_big = Math.max(0, d_mid + taper * (length / 2));

    switch (config.volFormula) {
      case 'huber':
        return (Math.PI * Math.pow(d_mid / 100, 2) / 4) * length;
      case 'smalian':
        const area1 = Math.PI * Math.pow(d_big / 100, 2) / 4;
        const area2 = Math.PI * Math.pow(d_small / 100, 2) / 4;
        return ((area1 + area2) / 2) * length;
      case 'newton':
        const D = d_big / 100;
        const M = d_mid / 100;
        const d = d_small / 100;
        return length * (Math.PI / 24) * (D * D + 4 * M * M + d * d);
      default:
        return 0;
    }
  };

  const checkSuitability = (diameter: number, length: number): boolean => {
    const dims = getPostDimensions();
    if (!dims) return false;
    
    const minDia = calculateMinDiameter(dims);
    const d_mid = toDIB(diameter);
    
    if (length > 0) {
      const d_small = Math.max(0, d_mid - config.taper * (length / 2));
      return d_small >= minDia;
    }
    return d_mid >= minDia;
  };

  const handleAddLog = () => {
    const newLog: Omit<BalkenLog, 'id'> = {
      diameter: 0,
      length: 0,
    };
    addLog(newLog);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Alle Stämme löschen',
      'Sollen alle Stämme gelöscht werden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: clearAllLogs,
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    if (logs.length === 0) {
      Alert.alert('Hinweis', 'Keine Daten zum Exportieren vorhanden.');
      return;
    }
    setIsExporting(true);
    try {
      await exportToCSV(dims, calculateVolume, checkSuitability);
      Alert.alert('Erfolg', 'CSV-Datei erfolgreich erstellt.');
    } catch (error) {
      Alert.alert('Fehler', 'Export fehlgeschlagen.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCalculate = () => {
    const dimensions = getPostDimensions();
    if (!dimensions) {
      Alert.alert('Fehler', 'Bitte gültige Pfostenmaße eingeben.');
      return;
    }
    setIsCalculating(true);
    setTimeout(() => {
      // Trigger recalculation for all logs
      logs.forEach(log => {
        updateLog(log.id, { ...log });
      });
      Alert.alert('Berechnung', `Minimaler Durchmesser: ${minDiameter.toFixed(1)} cm\nGesamtvolumen: ${totalVolume.toFixed(3)} m³`);
      setIsCalculating(false);
    }, 100);
  };

  // Live calculation effect
  useEffect(() => {
    if (config.liveCalc && logs.length > 0) {
      // Trigger recalculation when config or dimensions change
      const timer = setTimeout(() => {
        logs.forEach(log => {
          updateLog(log.id, { ...log });
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [config.liveCalc, config, postType, customWidth, customHeight, logs, updateLog]);

  // Load saved state
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('balkenUIState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setPostType(state.postType || 'custom');
        setCustomWidth(state.customWidth || '');
        setCustomHeight(state.customHeight || '');
        setDarkMode(state.darkMode || false);
      }
    } catch (error) {
      console.error('Error loading UI state:', error);
    }
  };

  const saveUIState = useCallback(async () => {
    try {
      const state = {
        postType,
        customWidth,
        customHeight,
        darkMode,
      };
      await AsyncStorage.setItem('balkenUIState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving UI state:', error);
    }
  }, [postType, customWidth, customHeight, darkMode]);

  // Save UI state when it changes
  useEffect(() => {
    saveUIState();
  }, [saveUIState]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const totalVolume = logs.reduce((sum, log) => {
    return sum + calculateVolume(log.diameter, log.length);
  }, 0);

  const dims = getPostDimensions();
  const minDiameter = dims ? calculateMinDiameter(dims) : 0;
  const currentLogDiameter = logs.length > 0 ? toDIB(logs[0]?.diameter || 0) : 0;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Balken-Stamm Pro</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={toggleDarkMode}
            >
              <Text style={styles.darkModeText}>{darkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Settings color={darkMode ? '#2ecc71' : '#4CAF50'} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Pfosten-Konfiguration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, darkMode && styles.labelDark]}>Pfosten auswählen:</Text>
            <View style={styles.postButtons}>
              {Object.keys(postPresets).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.postButton,
                    postType === key && styles.postButtonActive,
                  ]}
                  onPress={() => setPostType(key)}
                >
                  <Text
                    style={[
                      styles.postButtonText,
                      postType === key && styles.postButtonTextActive,
                    ]}
                  >
                    {key.replace('x', ' × ')} cm
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.postButton,
                  postType === 'custom' && styles.postButtonActive,
                ]}
                onPress={() => setPostType('custom')}
              >
                <Text
                  style={[
                    styles.postButtonText,
                    postType === 'custom' && styles.postButtonTextActive,
                  ]}
                >
                  Benutzerdefiniert
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {postType === 'custom' && (
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, darkMode && styles.labelDark]}>Breite (cm):</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.inputDark]}
                  value={customWidth}
                  onChangeText={setCustomWidth}
                  placeholder="z.B. 15"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, darkMode && styles.labelDark]}>Höhe (cm):</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.inputDark]}
                  value={customHeight}
                  onChangeText={setCustomHeight}
                  placeholder="z.B. 20"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, darkMode && styles.labelDark]}>Min. Stammdurchmesser:</Text>
            <Text style={[styles.resultValue, darkMode && styles.resultValueDark]}>
              {dims ? `${minDiameter.toFixed(1)} cm` : '–'}
            </Text>
          </View>
        </View>

        <BalkenVisualization
          postDimensions={dims}
          minDiameter={minDiameter}
          currentLogDiameter={currentLogDiameter}
        />

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Stämme verwalten</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
              <Plus color="#4CAF50" size={20} />
              <Text style={styles.addButtonText}>Stamm hinzufügen</Text>
            </TouchableOpacity>
          </View>

          <BalkenTable
            logs={logs}
            onUpdate={updateLog}
            onDelete={deleteLog}
            calculateVolume={calculateVolume}
            checkSuitability={checkSuitability}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Gesamtvolumen:</Text>
            <Text style={styles.totalValue}>
              {totalVolume.toFixed(3)} m³
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCalculate}>
            <Calculator color="#fff" size={20} />
            <Text style={styles.primaryButtonText}>Berechnen & prüfen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleExportCSV}>
            <Download color="#fff" size={20} />
            <Text style={styles.secondaryButtonText}>CSV Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
            <Trash2 color="#fff" size={20} />
            <Text style={styles.dangerButtonText}>Alle löschen</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, darkMode && styles.footerDark]}>© Kofler e. U. | Balken-Stamm Pro 2.6</Text>
      </ScrollView>

      <BalkenSettings
        visible={showSettings}
        config={config}
        onSave={updateConfig}
        onClose={() => setShowSettings(false)}
      />

      {/* Loading Overlay */}
      {(isExporting || isCalculating) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {isExporting ? 'Exportiere...' : 'Berechne...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function BalkenTab() {
  return (
    <BalkenProvider>
      <BalkenScreen />
    </BalkenProvider>
  );
}

const styles = StyleSheet.create({
  // Light mode styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
  },
  postButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  postButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  postButtonText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  postButtonTextActive: {
    color: '#fff',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5bc0de',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  footer: {
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontSize: 14,
    color: '#666',
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: '#343a40',
  },
  headerDark: {
    backgroundColor: '#495057',
    borderBottomColor: '#6c757d',
  },
  titleDark: {
    color: '#f8f9fa',
  },
  cardDark: {
    backgroundColor: '#495057',
  },
  cardTitleDark: {
    color: '#2ecc71',
  },
  labelDark: {
    color: '#f8f9fa',
  },
  inputDark: {
    backgroundColor: '#495057',
    borderColor: '#6c757d',
    color: '#f8f9fa',
  },
  resultValueDark: {
    color: '#2ecc71',
  },
  footerDark: {
    color: '#adb5bd',
    borderTopColor: '#6c757d',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  darkModeText: {
    fontSize: 20,
  },
});