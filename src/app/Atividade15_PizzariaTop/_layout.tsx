import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  PizzariaTopProvider,
  usePizzariaTop,
} from '../../components/pizzariatop/PizzariaTopContext';

function SessionHydrator() {
  const { refreshSession } = usePizzariaTop();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Atividade15Layout() {
  return (
    <PizzariaTopProvider>
      <SessionHydrator />
    </PizzariaTopProvider>
  );
}
