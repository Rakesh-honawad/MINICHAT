import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SettingsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile & Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>User123</Text>

        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>+91 9876543210</Text>

        <Text style={styles.label}>Device ID</Text>
        <Text style={styles.value}>MINI-8F3A</Text>

        <Text style={styles.label}>Public Key</Text>
        <Text style={styles.value}>
          f92ab1e9b3... (fingerprint)
        </Text>
      </View>

      <Text style={styles.note}>
        *This is a placeholder. Real data will be added later.
      </Text>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F7F7F7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  note: {
    marginTop: 20,
    color: '#999',
    fontSize: 13,
  },
});
