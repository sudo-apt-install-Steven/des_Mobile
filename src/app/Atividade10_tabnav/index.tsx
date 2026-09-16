import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomRoutes } from '../../routes/BottomRoutes';

export default function Atividade10() {
  return (
    <View style={styles.container}>
      <BottomRoutes />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});
