import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade4_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';

export default function Atividade4() {
  const [contador, setContador] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Meu Contador</Text>
        
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>{contador}</Text>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.btnWrapper}>
            <Botao titulo="-10" corDeFundo="#DC2626" onPress={() => setContador(contador - 10)} />
          </View>
          <View style={styles.btnWrapper}>
            <Botao titulo="+10" corDeFundo="#059669" onPress={() => setContador(contador + 10)} />
          </View>
        </View>
        
        <View style={styles.fullWidthBtn}>
            <Botao titulo="Zerar" corDeFundo="#D97706" onPress={() => setContador(0)} />
            <Botao titulo="Voltar" corDeFundo="#4B5563" onPress={() => router.push('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
