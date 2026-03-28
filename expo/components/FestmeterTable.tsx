import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Edit3, Trash2, Check, X } from 'lucide-react-native';
import { FestmeterCalculation, FestmeterConfig } from '@/types/festmeter';

interface Props {
  calculations: FestmeterCalculation[];
  config: FestmeterConfig;
  onUpdate: (id: string, updates: Partial<FestmeterCalculation>) => void;
  onDelete: (id: string) => void;
  calculateVolume: (
    length: number,
    d_mid?: number,
    d1?: number,
    d2?: number,
    method?: string
  ) => { volume: number; displayDiameter: string };
}

export function FestmeterTable({ calculations, config, onUpdate, onDelete, calculateVolume }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FestmeterCalculation>>({});

  if (calculations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Noch keine Berechnungen vorhanden</Text>
      </View>
    );
  }

  const handleEdit = (calc: FestmeterCalculation) => {
    setEditingId(calc.id);
    setEditData(calc);
  };

  const handleSave = () => {
    if (!editingId || !editData) return;

    const lengthValue = parseFloat(String(editData.length || 0).replace(',', '.'));
    if (lengthValue <= 0) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige Länge ein.');
      return;
    }

    let volume = 0;
    if (editData.calculationMethodUsed === 'huber_mid' && editData.diameter_mid) {
      const result = calculateVolume(lengthValue, editData.diameter_mid);
      volume = result.volume;
    } else if (editData.diameter_d1 && editData.diameter_d2) {
      const result = calculateVolume(lengthValue, undefined, editData.diameter_d1, editData.diameter_d2, editData.calculationMethodUsed);
      volume = result.volume;
    }

    if (volume <= 0) {
      Alert.alert('Fehler', 'Volumen ist 0 oder negativ.');
      return;
    }

    onUpdate(editingId, { ...editData, volume });
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (calc: FestmeterCalculation) => {
    Alert.alert(
      'Eintrag löschen',
      `Soll der Eintrag wirklich gelöscht werden?\nProjekt: ${calc.projectName}\nVolumen: ${calc.volume.toFixed(3)} m³`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => onDelete(calc.id),
        },
      ]
    );
  };

  const formatNumber = (value: number): string => {
    return value.toFixed(3).replace('.', ',');
  };

  // Group calculations by project
  const grouped: Record<string, { items: FestmeterCalculation[]; sumVolume: number; count: number }> = {};
  calculations.forEach(calc => {
    const pName = calc.projectName || 'Unbekanntes Projekt';
    if (!grouped[pName]) {
      grouped[pName] = { items: [], sumVolume: 0, count: 0 };
    }
    grouped[pName].items.push(calc);
    grouped[pName].sumVolume += calc.volume || 0;
    grouped[pName].count++;
  });

  const sortedProjectNames = Object.keys(grouped).sort();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Berechnungen</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.projectCell]}>Projekt</Text>
            <Text style={[styles.headerCell, styles.holzartCell]}>Holzart</Text>
            <Text style={[styles.headerCell, styles.qualitaetCell]}>Qualität</Text>
            <Text style={[styles.headerCell, styles.lengthCell]}>Länge (m)</Text>
            <Text style={[styles.headerCell, styles.diameterCell]}>Ø (cm)</Text>
            <Text style={[styles.headerCell, styles.volumeCell]}>Vol (m³)</Text>
            <Text style={[styles.headerCell, styles.actionsCell]}>Aktionen</Text>
          </View>

          {sortedProjectNames.map(projectName => {
            const group = grouped[projectName];
            return (
              <View key={projectName}>
                {group.items.map(calc => {
                  const isEditing = editingId === calc.id;
                  const { displayDiameter } = calculateVolume(
                    calc.length,
                    calc.diameter_mid,
                    calc.diameter_d1,
                    calc.diameter_d2,
                    calc.calculationMethodUsed
                  );

                  return (
                    <View key={calc.id} style={styles.dataRow}>
                      <View style={[styles.cell, styles.projectCell]}>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editData.projectName || ''}
                            onChangeText={(text) => setEditData({ ...editData, projectName: text })}
                          />
                        ) : (
                          <Text style={styles.cellText}>{calc.projectName || '-'}</Text>
                        )}
                      </View>

                      <View style={[styles.cell, styles.holzartCell]}>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editData.holzart || ''}
                            onChangeText={(text) => setEditData({ ...editData, holzart: text })}
                          />
                        ) : (
                          <Text style={styles.cellText}>{calc.holzart || '-'}</Text>
                        )}
                      </View>

                      <View style={[styles.cell, styles.qualitaetCell]}>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editData.qualitaet || ''}
                            onChangeText={(text) => setEditData({ ...editData, qualitaet: text })}
                          />
                        ) : (
                          <Text style={styles.cellText}>{calc.qualitaet || '-'}</Text>
                        )}
                      </View>

                      <View style={[styles.cell, styles.lengthCell]}>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(editData.length || '').replace('.', ',')}
                            onChangeText={(text) => setEditData({ ...editData, length: parseFloat(text.replace(',', '.')) || 0 })}
                            keyboardType="numeric"
                          />
                        ) : (
                          <Text style={styles.cellText}>{formatNumber(calc.length)}</Text>
                        )}
                      </View>

                      <View style={[styles.cell, styles.diameterCell]}>
                        {isEditing ? (
                          calc.calculationMethodUsed === 'huber_mid' ? (
                            <TextInput
                              style={styles.editInput}
                              value={String(editData.diameter_mid || '').replace('.', ',')}
                              onChangeText={(text) => setEditData({ ...editData, diameter_mid: parseFloat(text.replace(',', '.')) || 0 })}
                              keyboardType="numeric"
                              placeholder="Mittendurchm."
                            />
                          ) : (
                            <View style={styles.diameterInputs}>
                              <TextInput
                                style={[styles.editInput, styles.smallInput]}
                                value={String(editData.diameter_d1 || '').replace('.', ',')}
                                onChangeText={(text) => setEditData({ ...editData, diameter_d1: parseFloat(text.replace(',', '.')) || 0 })}
                                keyboardType="numeric"
                                placeholder="D1"
                              />
                              <Text style={styles.separator}>/</Text>
                              <TextInput
                                style={[styles.editInput, styles.smallInput]}
                                value={String(editData.diameter_d2 || '').replace('.', ',')}
                                onChangeText={(text) => setEditData({ ...editData, diameter_d2: parseFloat(text.replace(',', '.')) || 0 })}
                                keyboardType="numeric"
                                placeholder="D2"
                              />
                            </View>
                          )
                        ) : (
                          <Text style={styles.cellText}>{displayDiameter}</Text>
                        )}
                      </View>

                      <View style={[styles.cell, styles.volumeCell]}>
                        <Text style={styles.cellText}>{formatNumber(calc.volume)}</Text>
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
                            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(calc)}>
                              <Edit3 color="#4CAF50" size={16} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(calc)}>
                              <Trash2 color="#f44336" size={16} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}

                <View style={styles.sumRow}>
                  <Text style={[styles.sumCell, styles.projectCell]}>Summe {projectName}</Text>
                  <Text style={[styles.sumCell, styles.holzartCell]}></Text>
                  <Text style={[styles.sumCell, styles.qualitaetCell]}></Text>
                  <Text style={[styles.sumCell, styles.lengthCell]}>{group.count} Stk.</Text>
                  <Text style={[styles.sumCell, styles.diameterCell]}></Text>
                  <Text style={[styles.sumCell, styles.volumeCell]}>{formatNumber(group.sumVolume)}</Text>
                  <Text style={[styles.sumCell, styles.actionsCell]}></Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    padding: 20,
    paddingBottom: 0,
  },
  table: {
    minWidth: 800,
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
  sumRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sumCell: {
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    backgroundColor: '#e8f5e9',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
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
  projectCell: { width: 120 },
  holzartCell: { width: 80 },
  qualitaetCell: { width: 80 },
  lengthCell: { width: 80 },
  diameterCell: { width: 100 },
  volumeCell: { width: 80 },
  actionsCell: { width: 100 },
  diameterInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  smallInput: {
    flex: 1,
    padding: 4,
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 2,
  },
});