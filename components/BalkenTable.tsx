import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Edit3, Trash2, Check, X } from 'lucide-react-native';
import { BalkenLog } from '@/types/balken';

interface Props {
  logs: BalkenLog[];
  onUpdate: (id: string, updates: Partial<BalkenLog>) => void;
  onDelete: (id: string) => void;
  calculateVolume: (diameter: number, length: number) => number;
  checkSuitability: (diameter: number, length: number) => boolean;
}

export function BalkenTable({ logs, onUpdate, onDelete, calculateVolume, checkSuitability }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BalkenLog>>({});

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Noch keine Stämme hinzugefügt</Text>
      </View>
    );
  }

  const handleEdit = (log: BalkenLog) => {
    setEditingId(log.id);
    setEditData(log);
  };

  const handleSave = () => {
    if (!editingId || !editData) return;

    const diameter = parseFloat(String(editData.diameter || 0).replace(',', '.'));
    const length = parseFloat(String(editData.length || 0).replace(',', '.'));

    if (diameter < 0 || length < 0) {
      Alert.alert('Fehler', 'Bitte geben Sie gültige Werte ein.');
      return;
    }

    onUpdate(editingId, { diameter, length });
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (log: BalkenLog) => {
    Alert.alert(
      'Stamm löschen',
      `Soll der Stamm wirklich gelöscht werden?\nØ: ${log.diameter} cm, Länge: ${log.length} m`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => onDelete(log.id),
        },
      ]
    );
  };

  const formatNumber = (value: number): string => {
    return value.toFixed(3).replace('.', ',');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.indexCell]}>Stamm #</Text>
        <Text style={[styles.headerCell, styles.diameterCell]}>Ø (cm)</Text>
        <Text style={[styles.headerCell, styles.lengthCell]}>Länge (m)</Text>
        <Text style={[styles.headerCell, styles.volumeCell]}>Volumen (m³)</Text>
        <Text style={[styles.headerCell, styles.suitabilityCell]}>Eignung</Text>
        <Text style={[styles.headerCell, styles.actionsCell]}>Aktionen</Text>
      </View>

      {logs.map((log, index) => {
        const isEditing = editingId === log.id;
        const volume = calculateVolume(log.diameter, log.length);
        const suitable = checkSuitability(log.diameter, log.length);

        return (
          <View key={log.id} style={styles.dataRow}>
            <View style={[styles.cell, styles.indexCell]}>
              <Text style={styles.cellText}>{index + 1}</Text>
            </View>

            <View style={[styles.cell, styles.diameterCell]}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={String(editData.diameter || '').replace('.', ',')}
                  onChangeText={(text) => setEditData({ ...editData, diameter: parseFloat(text.replace(',', '.')) || 0 })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.cellText}>{log.diameter > 0 ? log.diameter.toFixed(1) : '–'}</Text>
              )}
            </View>

            <View style={[styles.cell, styles.lengthCell]}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={String(editData.length || '').replace('.', ',')}
                  onChangeText={(text) => setEditData({ ...editData, length: parseFloat(text.replace(',', '.')) || 0 })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.cellText}>{log.length > 0 ? log.length.toFixed(2) : '–'}</Text>
              )}
            </View>

            <View style={[styles.cell, styles.volumeCell]}>
              <Text style={styles.cellText}>
                {volume > 0 ? formatNumber(volume) : '–'}
              </Text>
            </View>

            <View style={[styles.cell, styles.suitabilityCell]}>
              {log.diameter > 0 ? (
                <Text style={[styles.suitabilityText, suitable ? styles.suitable : styles.unsuitable]}>
                  {suitable ? '✓' : '✗'}
                </Text>
              ) : (
                <Text style={styles.cellText}>–</Text>
              )}
            </View>

            <View style={[styles.cell, styles.actionsCell]}>
              {isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Check color="#fff" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <X color="#fff" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(log)}>
                    <Edit3 color="#4CAF50" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(log)}>
                    <Trash2 color="#f44336" size={16} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    backgroundColor: '#e8f5e9',
    textAlign: 'center',
  },
  suitabilityText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  suitable: {
    color: '#4CAF50',
  },
  unsuitable: {
    color: '#f44336',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 6,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 6,
    borderRadius: 4,
  },
  indexCell: { flex: 0.8 },
  diameterCell: { flex: 1.2 },
  lengthCell: { flex: 1.2 },
  volumeCell: { flex: 1.5 },
  suitabilityCell: { flex: 1 },
  actionsCell: { flex: 1.5 },
});