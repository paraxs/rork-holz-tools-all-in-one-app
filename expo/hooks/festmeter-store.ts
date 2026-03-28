import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FestmeterCalculation, FestmeterConfig } from '@/types/festmeter';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const CALC_DATA_KEY = 'festmeterCalculations_v3_2';
const CONFIG_KEY = 'festmeterConfig_v3_2';

export const [FestmeterProvider, useFestmeter] = createContextHook(() => {
  const [calculations, setCalculations] = useState<FestmeterCalculation[]>([]);
  const [config, setConfig] = useState<FestmeterConfig>({
    calculationMethod: 'huber_mid',
    barkDeductionType: 'none',
    barkDeductionValue: 0,
  });

  useEffect(() => {
    loadData();
    loadConfig();
  }, []);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(CALC_DATA_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setCalculations(parsed.filter((item: any) => 
          item && typeof item.projectName === 'string' && typeof item.length === 'number'
        ));
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
    }
  };

  const saveData = async (data: FestmeterCalculation[]) => {
    try {
      await AsyncStorage.setItem(CALC_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving calculations:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const storedConfig = await AsyncStorage.getItem(CONFIG_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        setConfig({
          calculationMethod: parsed.calculationMethod || 'huber_mid',
          barkDeductionType: parsed.barkDeductionType || 'none',
          barkDeductionValue: parseFloat(parsed.barkDeductionValue) || 0,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async (newConfig: FestmeterConfig) => {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const addCalculation = useCallback((calc: Omit<FestmeterCalculation, 'id' | 'timestamp'>) => {
    const newCalc: FestmeterCalculation = {
      ...calc,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...calculations, newCalc];
    setCalculations(updated);
    saveData(updated);
  }, [calculations]);

  const updateCalculation = useCallback((id: string, updates: Partial<FestmeterCalculation>) => {
    const updated = calculations.map(calc => 
      calc.id === id ? { ...calc, ...updates } : calc
    );
    setCalculations(updated);
    saveData(updated);
  }, [calculations]);

  const deleteCalculation = useCallback((id: string) => {
    const updated = calculations.filter(calc => calc.id !== id);
    setCalculations(updated);
    saveData(updated);
  }, [calculations]);

  const clearAllCalculations = useCallback(() => {
    setCalculations([]);
    saveData([]);
  }, []);

  const updateConfig = useCallback((newConfig: FestmeterConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  const exportToExcel = useCallback(async () => {
    if (calculations.length === 0) {
      throw new Error('Keine Daten zum Exportieren vorhanden.');
    }

    try {
      // Group calculations by project
      const grouped: Record<string, { items: FestmeterCalculation[], sumVolume: number, count: number }> = {};
      calculations.forEach(calc => {
        const pName = calc.projectName || 'Unbekannt';
        if (!grouped[pName]) {
          grouped[pName] = { items: [], sumVolume: 0, count: 0 };
        }
        grouped[pName].items.push(calc);
        grouped[pName].sumVolume += calc.volume || 0;
        grouped[pName].count++;
      });

      // Create CSV content
      let csvContent = 'Projektname;Holzart;Qualität;Länge (m);D_Mitte (cm);D1 (cm);D2 (cm);Methode;Volumen (Fm³);Zeitstempel\n';
      
      const sortedProjectNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'de'));
      sortedProjectNames.forEach(pName => {
        const group = grouped[pName];
        group.items.forEach(calc => {
          csvContent += `${calc.projectName || '-'};${calc.holzart || '-'};${calc.qualitaet || '-'};`;
          csvContent += `${calc.length ? calc.length.toFixed(3) : '-'};`;
          csvContent += `${calc.diameter_mid ? calc.diameter_mid.toFixed(1) : '-'};`;
          csvContent += `${calc.diameter_d1 ? calc.diameter_d1.toFixed(1) : '-'};`;
          csvContent += `${calc.diameter_d2 ? calc.diameter_d2.toFixed(1) : '-'};`;
          csvContent += `${calc.calculationMethodUsed || '-'};`;
          csvContent += `${calc.volume ? calc.volume.toFixed(3) : '-'};`;
          csvContent += `${calc.timestamp ? new Date(calc.timestamp).toLocaleString('de-DE') : '-'}\n`;
        });
        csvContent += `Summe ${pName};;;${group.count} Stk.;;;;${group.sumVolume.toFixed(3)};\n\n`;
      });

      // Save and share file
      const fileName = `Festmeter_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For mobile, share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Erfolg', `Datei gespeichert: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [calculations]);

  const exportToPDF = useCallback(async () => {
    // PDF export is complex and would require additional libraries
    // For now, we'll export as formatted text file
    if (calculations.length === 0) {
      throw new Error('Keine Daten zum Exportieren vorhanden.');
    }

    try {
      let content = 'FESTMETER AUFSTELLUNG\n';
      content += '======================\n\n';
      content += `Exportiert am: ${new Date().toLocaleString('de-DE')}\n`;
      content += `Rindenabzug: ${config.barkDeductionType === 'none' ? 'Kein' : `${config.barkDeductionValue}${config.barkDeductionType === '%' ? '%' : 'cm'}`}\n\n`;

      // Group calculations by project
      const grouped: Record<string, { items: FestmeterCalculation[], sumVolume: number, count: number }> = {};
      calculations.forEach(calc => {
        const pName = calc.projectName || 'Unbekannt';
        if (!grouped[pName]) {
          grouped[pName] = { items: [], sumVolume: 0, count: 0 };
        }
        grouped[pName].items.push(calc);
        grouped[pName].sumVolume += calc.volume || 0;
        grouped[pName].count++;
      });

      const sortedProjectNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'de'));
      sortedProjectNames.forEach(pName => {
        const group = grouped[pName];
        content += `\nProjekt: ${pName}\n`;
        content += '-'.repeat(50) + '\n';
        
        group.items.forEach((calc, index) => {
          content += `${index + 1}. ${calc.holzart || '-'} | ${calc.qualitaet || '-'} | `;
          content += `Länge: ${calc.length?.toFixed(3) || '-'}m | `;
          content += `Volumen: ${calc.volume?.toFixed(3) || '-'} Fm³\n`;
        });
        
        content += `\nSumme: ${group.count} Stück | Gesamtvolumen: ${group.sumVolume.toFixed(3)} Fm³\n`;
        content += '='.repeat(50) + '\n';
      });

      // Save and share file
      const fileName = `Festmeter_${new Date().toISOString().slice(0, 10)}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For mobile, share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Erfolg', `Datei gespeichert: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [calculations, config]);

  return useMemo(() => ({
    calculations,
    config,
    addCalculation,
    updateCalculation,
    deleteCalculation,
    clearAllCalculations,
    updateConfig,
    exportToExcel,
    exportToPDF,
  }), [calculations, config, addCalculation, updateCalculation, deleteCalculation, clearAllCalculations, updateConfig, exportToExcel, exportToPDF]);
});