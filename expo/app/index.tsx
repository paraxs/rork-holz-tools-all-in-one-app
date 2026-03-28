import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calculator, Ruler } from 'lucide-react-native';

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Holz-Tools</Text>
          <Text style={styles.subtitle}>Festmeter & Balken-Stamm</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/(tabs)/festmeter')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Calculator color="#fff" size={32} />
            </View>
            <Text style={styles.cardTitle}>Festmeter-Rechner</Text>
            <Text style={styles.cardDescription}>
              Berechnen Sie das Holzvolumen in Festmetern mit verschiedenen Messmethoden
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.feature}>• Huber & Smalian Formeln</Text>
              <Text style={styles.feature}>• Rindenabzug-Optionen</Text>
              <Text style={styles.feature}>• Excel/PDF Export</Text>
              <Text style={styles.feature}>• Projektgruppierung</Text>
            </View>
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Öffnen →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSecondary]}
            onPress={() => router.push('/(tabs)/balken')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.iconContainerSecondary]}>
              <Ruler color="#fff" size={32} />
            </View>
            <Text style={styles.cardTitle}>Balken-Stamm Pro</Text>
            <Text style={styles.cardDescription}>
              Prüfen Sie die Eignung von Stämmen für Balken und Pfosten
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.feature}>• Visualisierung</Text>
              <Text style={styles.feature}>• Volumenberechnung</Text>
              <Text style={styles.feature}>• Eignungsprüfung</Text>
              <Text style={styles.feature}>• Dark Mode</Text>
            </View>
            <View style={[styles.cardButton, styles.cardButtonSecondary]}>
              <Text style={styles.cardButtonText}>Öffnen →</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© Kofler e. U. – All-in-One Version</Text>
          <Text style={styles.version}>Version 2025-08-31</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  cardsContainer: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardSecondary: {
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerSecondary: {
    backgroundColor: '#5bc0de',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  cardFeatures: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  cardButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonSecondary: {
    backgroundColor: '#5bc0de',
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
});