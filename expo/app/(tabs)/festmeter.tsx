import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Trash2, Download, FileText, ChevronDown } from 'lucide-react-native';
import { FestmeterProvider, useFestmeter } from '@/hooks/festmeter-store';
import { FestmeterCalculation } from '@/types/festmeter';
import { FestmeterTable } from '@/components/FestmeterTable';
import { FestmeterSettings } from '@/components/FestmeterSettings';

function FestmeterScreen() {
  const {
    calculations,
    config,
    addCalculation,
    updateCalculation,
    deleteCalculation,
    clearAllCalculations,
    updateConfig,
    exportToExcel,
    exportToPDF,
  } = useFestmeter();

  const [projectName, setProjectName] = useState<string>('');
  const [holzart, setHolzart] = useState<string>('');
  const [qualitaet, setQualitaet] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [diameter, setDiameter] = useState<string>('');
  const [d1, setD1] = useState<string>('');
  const [d2, setD2] = useState<string>('');
  const [method, setMethod] = useState<string>('huber_mid');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showActions, setShowActions] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    setMethod(config.calculationMethod);
  }, [config.calculationMethod]);

  const showMessage = (msg: string, type: 'success' | 'error' = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const parseFloatInput = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const applyBarkDeduction = (diameter: number): number => {
    if (config.barkDeductionType === 'none' || config.barkDeductionValue <= 0) {
      return diameter;
    }
    if (config.barkDeductionType === '%') {
      return Math.max(0, diameter * (1 - config.barkDeductionValue / 100));
    }
    if (config.barkDeductionType === 'cm') {
      return Math.max(0, diameter - config.barkDeductionValue);
    }
    return diameter;
  };

  const calculateVolume = (
    length: number,
    d_mid?: number,
    d1?: number,
    d2?: number,
    method: string = 'huber_mid'
  ): { volume: number; displayDiameter: string } => {
    if (isNaN(length) || length <= 0) return { volume: 0, displayDiameter: '-' };

    let volume = 0;
    let displayDiameter = '-';

    switch (method) {
      case 'huber_mid':
        if (d_mid && d_mid > 0) {
          const effective_d = applyBarkDeduction(d_mid);
          const r = (effective_d / 2) / 100; // Convert to meters
          volume = Math.PI * r * r * length;
          displayDiameter = effective_d.toFixed(1);
        }
        break;
      case 'huber_avg_ends':
        if (d1 && d1 > 0 && d2 && d2 > 0) {
          const effective_d1 = applyBarkDeduction(d1);
          const effective_d2 = applyBarkDeduction(d2);
          const avgDiameter = (effective_d1 + effective_d2) / 2;
          const r = (avgDiameter / 2) / 100;
          volume = Math.PI * r * r * length;
          displayDiameter = `${effective_d1.toFixed(1)} / ${effective_d2.toFixed(1)}`;
        }
        break;
      case 'smalian':
        if (d1 && d1 > 0 && d2 && d2 > 0) {
          const effective_d1 = applyBarkDeduction(d1);
          const effective_d2 = applyBarkDeduction(d2);
          const r1 = (effective_d1 / 2) / 100;
          const r2 = (effective_d2 / 2) / 100;
          const area1 = Math.PI * r1 * r1;
          const area2 = Math.PI * r2 * r2;
          volume = ((area1 + area2) / 2) * length;
          displayDiameter = `${effective_d1.toFixed(1)} / ${effective_d2.toFixed(1)}`;
        }
        break;
    }

    return { volume, displayDiameter };
  };

  const handleAddCalculation = () => {
    if (!projectName.trim()) {
      showMessage('Bitte geben Sie einen Projektnamen ein.');
      return;
    }

    const lengthValue = parseFloatInput(length);
    if (lengthValue <= 0) {
      showMessage('Bitte geben Sie eine gültige Länge ein.');
      return;
    }

    let d_mid: number | undefined;
    let d1_val: number | undefined;
    let d2_val: number | undefined;

    if (method === 'huber_mid') {
      d_mid = parseFloatInput(diameter);
      if (d_mid <= 0) {
        showMessage('Bitte geben Sie einen gültigen Durchmesser ein.');
        return;
      }
    } else {
      d1_val = parseFloatInput(d1);
      d2_val = parseFloatInput(d2);
      if (d1_val <= 0 || d2_val <= 0) {
        showMessage('Bitte geben Sie gültige Enddurchmesser ein.');
        return;
      }
    }

    const { volume } = calculateVolume(lengthValue, d_mid, d1_val, d2_val, method);
    if (volume <= 0) {
      showMessage('Fehler: Volumen ist 0 oder negativ.');
      return;
    }

    const calculation: Omit<FestmeterCalculation, 'id' | 'timestamp'> = {
      projectName: projectName.trim(),
      holzart: holzart.trim(),
      qualitaet: qualitaet.trim(),
      length: lengthValue,
      diameter_mid: d_mid,
      diameter_d1: d1_val,
      diameter_d2: d2_val,
      calculationMethodUsed: method,
      volume,
    };

    addCalculation(calculation);
    
    // Reset form but keep length
    setDiameter('');
    setD1('');
    setD2('');
    
    showMessage('Position hinzugefügt.', 'success');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Alle Daten löschen',
      'WARNUNG: Alle gespeicherten Berechnungen werden unwiderruflich gelöscht. Fortfahren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            clearAllCalculations();
            showMessage('Alle Daten wurden gelöscht.', 'success');
          },
        },
      ]
    );
  };

  const handleExportExcel = async () => {
    if (calculations.length === 0) {
      showMessage('Keine Daten zum Exportieren vorhanden.');
      return;
    }
    setIsExporting(true);
    setShowActions(false);
    try {
      await exportToExcel();
      showMessage('Excel-Datei erfolgreich erstellt.', 'success');
    } catch (error) {
      showMessage('Fehler beim Excel-Export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (calculations.length === 0) {
      showMessage('Keine Daten zum Exportieren vorhanden.');
      return;
    }
    setIsExporting(true);
    setShowActions(false);
    try {
      await exportToPDF();
      showMessage('PDF-Datei erfolgreich erstellt.', 'success');
    } catch (error) {
      showMessage('Fehler beim PDF-Export.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderInputFields = () => {
    if (method === 'huber_mid') {
      return (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Länge (m):</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="z.B. 4,00"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mittendurchm. (cm):</Text>
            <TextInput
              style={styles.input}
              value={diameter}
              onChangeText={setDiameter}
              placeholder="z.B. 35,5"
              keyboardType="numeric"
            />
          </View>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Länge (m):</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="z.B. 5,10"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>D1 (cm):</Text>
              <TextInput
                style={styles.input}
                value={d1}
                onChangeText={setD1}
                placeholder="z.B. 32,0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>D2 (cm):</Text>
              <TextInput
                style={styles.input}
                value={d2}
                onChangeText={setD2}
                placeholder="z.B. 38,5"
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Festmeter-Rechner Pro</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings color="#4CAF50" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projektdaten</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Projektname:</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="z.B. Polter Waldweg_1"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Holzart:</Text>
              <TextInput
                style={styles.input}
                value={holzart}
                onChangeText={setHolzart}
                placeholder="z.B. Fichte"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Qualität:</Text>
              <TextInput
                style={styles.input}
                value={qualitaet}
                onChangeText={setQualitaet}
                placeholder="z.B. B/C"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maße eingeben</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Messmethode:</Text>
            <View style={styles.methodButtons}>
              {[
                { key: 'huber_mid', label: 'Mittendurchmesser' },
                { key: 'huber_avg_ends', label: 'Enddurchmesser (Huber)' },
                { key: 'smalian', label: 'Enddurchmesser (Smalian)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.methodButton,
                    method === item.key && styles.methodButtonActive,
                  ]}
                  onPress={() => setMethod(item.key)}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      method === item.key && styles.methodButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {renderInputFields()}
        </View>

        {message ? (
          <View style={[styles.message, messageType === 'success' && styles.messageSuccess]}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddCalculation}>
            <Text style={styles.primaryButtonText}>Position hinzufügen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setShowActions(true)}
          >
            <Text style={styles.secondaryButtonText}>Aktionen</Text>
            <ChevronDown color="#fff" size={16} />
          </TouchableOpacity>
        </View>

        <FestmeterTable
          calculations={calculations}
          config={config}
          onUpdate={updateCalculation}
          onDelete={deleteCalculation}
          calculateVolume={calculateVolume}
        />
      </ScrollView>

      <FestmeterSettings
        visible={showSettings}
        config={config}
        onSave={updateConfig}
        onClose={() => setShowSettings(false)}
      />

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                setShowSettings(true);
              }}
            >
              <Settings color="#333" size={20} />
              <Text style={styles.actionItemText}>Einstellungen ändern</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionItem,
                calculations.length === 0 && styles.disabledAction,
              ]}
              onPress={handleExportExcel}
              disabled={calculations.length === 0}
            >
              <FileText color={calculations.length > 0 ? "#333" : "#999"} size={20} />
              <Text
                style={[
                  styles.actionItemText,
                  calculations.length === 0 && styles.disabledText,
                ]}
              >
                Export als Excel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionItem,
                calculations.length === 0 && styles.disabledAction,
              ]}
              onPress={handleExportPDF}
              disabled={calculations.length === 0}
            >
              <Download color={calculations.length > 0 ? "#333" : "#999"} size={20} />
              <Text
                style={[
                  styles.actionItemText,
                  calculations.length === 0 && styles.disabledText,
                ]}
              >
                Export als PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                handleClearAll();
              }}
            >
              <Trash2 color="#d9534f" size={20} />
              <Text style={[styles.actionItemText, { color: "#d9534f" }]}>
                Alle Daten löschen
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Overlay */}
      {isExporting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Exportiere...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function FestmeterTab() {
  return (
    <FestmeterProvider>
      <FestmeterScreen />
    </FestmeterProvider>
  );
}

const styles = StyleSheet.create({
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
  methodButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  methodButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  methodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  message: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  messageSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#d32f2f',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5bc0de',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionItemText: {
    fontSize: 16,
    color: '#333',
  },
  disabledAction: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
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
});