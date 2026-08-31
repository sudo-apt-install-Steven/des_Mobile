import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade6_styles';
import { router } from 'expo-router';
import EntradaTexto from '../../components/EntradaTexto';
import Botao from '../../components/Botao';

export default function Atividade6() {
  const [pesoRacao, setPesoRacao] = useState('');
  const [racaoDiaria, setRacaoDiaria] = useState<number | null>(null);

  const [pesoVacina, setPesoVacina] = useState('');
  const [doseVacina, setDoseVacina] = useState('');
  const [doseRecomendada, setDoseRecomendada] = useState<number | null>(null);

  const calcularRacao = () => {
    const peso = parseFloat(pesoRacao);
    if (!isNaN(peso)) {
      // 3% do peso, convertido para gramas (peso * 1000 * 0.03)
      setRacaoDiaria(peso * 1000 * 0.03);
    }
    Keyboard.dismiss();
  };

  const calcularDose = () => {
    const peso = parseFloat(pesoVacina);
    const dose = parseFloat(doseVacina);
    if (!isNaN(peso) && !isNaN(dose)) {
      setDoseRecomendada(peso * dose);
    }
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Cuidado animal</Text>
          <Text style={styles.subtitle}>Calculadora de ração e vacina</Text>
        </View>

        {/* Ração */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cálculo de ração</Text>
          
          <Text style={styles.label}>Peso do animal (kg)</Text>
          <EntradaTexto 
            style={styles.input} 
            placeholder="Ex: 12"
            keyboardType="numeric"
            placeholderTextColor="#6B7280"
            value={pesoRacao}
            onChangeText={setPesoRacao}
          />

          <TouchableOpacity style={styles.calcBtn} onPress={calcularRacao}>
            <Text style={styles.calcBtnText}>Calcular ração</Text>
          </TouchableOpacity>

          {racaoDiaria !== null && (
            <View style={styles.resultBoxGreen}>
              <Text style={styles.resultLabelGreen}>Ração{"\n"}diária</Text>
              <Text style={styles.resultValueGreen}>{racaoDiaria} <Text style={styles.unit}>g</Text></Text>
            </View>
          )}
        </View>

        {/* Vacina */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dose de vacina</Text>
          
          <Text style={styles.label}>Peso do animal (kg)</Text>
          <EntradaTexto 
            style={styles.input} 
            placeholder="Ex: 12"
            keyboardType="numeric"
            placeholderTextColor="#6B7280"
            value={pesoVacina}
            onChangeText={setPesoVacina}
          />

          <Text style={styles.label}>Dose por kg (ml)</Text>
          <EntradaTexto 
            style={styles.input} 
            placeholder="Ex: 0.5"
            keyboardType="numeric"
            placeholderTextColor="#6B7280"
            value={doseVacina}
            onChangeText={setDoseVacina}
          />

          <TouchableOpacity style={styles.calcBtn} onPress={calcularDose}>
            <Text style={styles.calcBtnText}>Calcular dose</Text>
          </TouchableOpacity>

          {doseRecomendada !== null && (
            <View style={styles.resultBoxBlue}>
              <Text style={styles.resultLabelBlue}>Dose recomendada</Text>
              <Text style={styles.resultValueBlue}>{doseRecomendada} <Text style={styles.unit}>ml</Text></Text>
            </View>
          )}
        </View>
        
        <Botao titulo="Voltar para o Hub" corDeFundo="#4B5563" onPress={() => router.push('/')} />
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
