import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BalkenLog, BalkenConfig } from '@/types/balken';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const LOGS_DATA_KEY = 'balkenLogs_v2_6';
const CONFIG_KEY = 'balkenConfig_v2_6';

export const [BalkenProvider, useBalken] = createContextHook(() => {
  const [logs, setLogs] = useState<BalkenLog[]>([]);
  const [config, setConfig] = useState<BalkenConfig>({
    allowance: 1.0,
    liveCalc: false,
    dibMode: 'dib',
    bark: 0,
    volFormula: 'huber',
    taper: 1.5,
  });

  useEffect(() => {
    loadData();
    loadConfig();
  }, []);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(LOGS_DATA_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setLogs(parsed.filter((item: any) => 
          item && typeof item.diameter === 'number'
        ));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveData = async (data: BalkenLog[]) => {
    try {
      await AsyncStorage.setItem(LOGS_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const storedConfig = await AsyncStorage.getItem(CONFIG_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        setConfig({
          allowance: parseFloat(parsed.allowance) || 1.0,
          liveCalc: parsed.liveCalc || false,
          dibMode: parsed.dibMode || 'dib',
          bark: parseFloat(parsed.bark) || 0,
          volFormula: parsed.volFormula || 'huber',
          taper: parseFloat(parsed.taper) || 1.5,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async (newConfig: BalkenConfig) => {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const addLog = useCallback((log: Omit<BalkenLog, 'id'>) => {
    const newLog: BalkenLog = {
      ...log,
      id: Date.now().toString(),
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    saveData(updated);
  }, [logs]);

  const updateLog = useCallback((id: string, updates: Partial<BalkenLog>) => {
    const updated = logs.map(log => 
      log.id === id ? { ...log, ...updates } : log
    );
    setLogs(updated);
    saveData(updated);
  }, [logs]);

  const deleteLog = useCallback((id: string) => {
    const updated = logs.filter(log => log.id !== id);
    setLogs(updated);
    saveData(updated);
  }, [logs]);

  const clearAllLogs = useCallback(() => {
    setLogs([]);
    saveData([]);
  }, []);

  const updateConfig = useCallback((newConfig: BalkenConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  const exportToCSV = useCallback(async (postDimensions: [number, number] | null, calculateVolume: (d: number, l: number) => number, checkSuitability: (d: number, l: number) => boolean) => {
    if (logs.length === 0) {
      throw new Error('Keine Daten zum Exportieren vorhanden.');
    }

    try {
      // Create CSV content
      let csvContent = '#;Durchmesser_cm(D_mid);Laenge_m;Volumen_m3;Geeignet\n';
      
      logs.forEach((log, index) => {
        const volume = calculateVolume(log.diameter, log.length);
        const suitable = checkSuitability(log.diameter, log.length);
        csvContent += `${index + 1};${log.diameter || ''};${log.length || ''};${volume.toFixed(3)};${suitable ? '1' : '0'}\n`;
      });

      // Add summary
      const totalVolume = logs.reduce((sum, log) => sum + calculateVolume(log.diameter, log.length), 0);
      csvContent += `\nGesamtvolumen:;;;${totalVolume.toFixed(3)};\n`;
      if (postDimensions) {
        csvContent += `Pfosten:;${postDimensions[0]}x${postDimensions[1]} cm;;;\n`;
      }

      // Save and share file
      const fileName = `balken-stamm_${new Date().toISOString().slice(0, 10)}.csv`;
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
  }, [logs]);

  return useMemo(() => ({
    logs,
    config,
    addLog,
    updateLog,
    deleteLog,
    clearAllLogs,
    updateConfig,
    exportToCSV,
  }), [logs, config, addLog, updateLog, deleteLog, clearAllLogs, updateConfig, exportToCSV]);
});