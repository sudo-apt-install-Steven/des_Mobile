import { StatusBar } from 'expo-status-bar';
import { Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade1_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';

export default function Atividade1() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Text style={styles.title}>Atividade 1</Text>
                
                <Image 
                  source={require('../../../assets/icon.png')} 
                  style={styles.image}
                  resizeMode="cover"
                />
                
                <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                        <Botao titulo="Ação 1" onPress={() => alert('Botão 1 Clicado!')} />
                    </View>
                    <View style={styles.buttonWrapper}>
                        <Botao titulo="Voltar" corDeFundo="#4B5563" onPress={() => router.push('/')} />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
