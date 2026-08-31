import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade7_styles';
import { router } from 'expo-router';
import EntradaTexto from '../../components/EntradaTexto';
import Botao from '../../components/Botao';

export default function Atividade7() {
  const [ano, setAno] = useState('');
  const [valor, setValor] = useState('');
  
  const [idade, setIdade] = useState<number | null>(null);
  const [seguro, setSeguro] = useState<number | null>(null);

  const calcularSeguro = () => {
    const anoCarro = parseInt(ano);
    const valorCarro = parseFloat(valor);
    const anoAtual = new Date().getFullYear();

    if (!isNaN(anoCarro) && !isNaN(valorCarro)) {
      const idadeVeiculo = anoAtual - anoCarro;
      const taxaBase = 5;
      const adicional = Math.floor(idadeVeiculo / 2) * 1;
      const taxaTotal = taxaBase + adicional;
      
      const valorSeguro = valorCarro * (taxaTotal / 100);

      setIdade(idadeVeiculo);
      setSeguro(valorSeguro);
    }
    Keyboard.dismiss();
  };

  const formatarReal = (valor: number) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Seguro veicular</Text>
          <Text style={styles.subtitle}>Calculadora do valor do seguro</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados do veículo</Text>
          
          <Text style={styles.label}>Ano do veículo</Text>
          <EntradaTexto 
            style={styles.input} 
            placeholder="Ex: 2018"
            keyboardType="numeric"
            placeholderTextColor="#6B7280"
            value={ano}
            onChangeText={setAno}
          />

          <Text style={styles.label}>Valor do veículo (R$)</Text>
          <EntradaTexto 
            style={styles.input} 
            placeholder="Ex: 45000"
            keyboardType="numeric"
            placeholderTextColor="#6B7280"
            value={valor}
            onChangeText={setValor}
          />

          <TouchableOpacity style={styles.calcBtn} onPress={calcularSeguro}>
            <Text style={styles.calcBtnText}>Calcular seguro</Text>
          </TouchableOpacity>

          {idade !== null && seguro !== null && (
            <>
              <View style={styles.resultBoxOrange}>
                <Text style={styles.resultLabelOrange}>Idade do{"\n"}veículo</Text>
                <Text style={styles.resultValueOrange}>{idade} <Text style={styles.unit}>anos</Text></Text>
              </View>

              <View style={styles.resultBoxGreen}>
                <Text style={styles.resultLabelGreen}>Valor do{"\n"}seguro</Text>
                <Text style={styles.resultValueGreen}>
                    <Text style={styles.unit}>R$ </Text>
                    {formatarReal(seguro)}
                </Text>
              </View>
            </>
          )}
        </View>
        
        <Botao titulo="Voltar para o Hub" corDeFundo="#4B5563" onPress={() => router.push('/')} />
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
