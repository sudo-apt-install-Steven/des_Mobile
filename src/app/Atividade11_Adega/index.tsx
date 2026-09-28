import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { styles } from '../../styles/atividade11_adega_styles';

type TabType = 'inicio' | 'catalogo' | 'contato';

export default function Atividade11Adega() {
  const [activeTab, setActiveTab] = useState<TabType>('inicio');

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'inicio':
        return 'Início';
      case 'catalogo':
        return 'Catálogo';
      case 'contato':
        return 'Contato';
      default:
        return 'Adega';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={16} color="#FFFFFF" />
          <Text style={styles.headerBackText}>Hub</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {/* Main Tab Screen Content */}
      <View style={styles.container}>
        {activeTab === 'inicio' && (
          <View style={styles.inicioContainer}>
            <ImageBackground
              source={require('../../../assets/adega/fundo_adega.jpg')}
              style={styles.inicioBackground}
              resizeMode="cover"
            >
              <View style={styles.inicioOverlay} />
              <View style={styles.inicioContent}>
                <Text style={styles.inicioTitle}>Adega Preferida</Text>
                <Text style={styles.inicioSubtitle}>
                  Aqui você encontra os melhores e mais saborosos vinhos.
                </Text>
              </View>
            </ImageBackground>
          </View>
        )}

        {activeTab === 'catalogo' && (
          <ScrollView
            style={styles.catalogoContainer}
            contentContainerStyle={styles.catalogoScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.catalogoTitle}>Nossos vinhos</Text>
            <Text style={styles.catalogoSubtitle}>
              Trabalhamos com o melhor vinho dos seguintes tipos: Vinho branco, vinho rosé, vinho tinto e vinho seco.
            </Text>

            {/* Vinho Branco */}
            <View style={styles.wineCard}>
              <View style={styles.wineImageWrapper}>
                <Image
                  source={require('../../../assets/adega/vinho-branco.jpg')}
                  style={styles.wineImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.wineDetails}>
                <Text style={styles.wineTitle}>Chatigny Chardonnay</Text>
                <Text style={styles.wineDescription}>
                  Vinho leve, refrescante e levemente cítrico da cor amarelo palha. Perfeito com carnes brancas e massa ao pesto.
                </Text>
              </View>
            </View>

            {/* Vinho Rosé */}
            <View style={styles.wineCard}>
              <View style={styles.wineImageWrapper}>
                <Image
                  source={require('../../../assets/adega/vinho-rose.jpg')}
                  style={styles.wineImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.wineDetails}>
                <Text style={styles.wineTitle}>Concha y Toro Exportacion</Text>
                <Text style={styles.wineDescription}>
                  Vinho rosé fresco, intenso e macio da cor rosa pálido. Perfeito com saladas e aperitivos.
                </Text>
              </View>
            </View>

            {/* Vinho Tinto */}
            <View style={styles.wineCard}>
              <View style={styles.wineImageWrapper}>
                <Image
                  source={require('../../../assets/adega/vinho-tinto.jpg')}
                  style={styles.wineImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.wineDetails}>
                <Text style={styles.wineTitle}>Portada Winemaker's</Text>
                <Text style={styles.wineDescription}>
                  Vinho encorpado, saboroso e frutado, com final levemente adocicado. Sua cor é vermelho-rubi. Perfeito com queijo parmesão e carnes assadas ou grelhadas.
                </Text>
              </View>
            </View>

            {/* Vinho Seco */}
            <View style={styles.wineCard}>
              <View style={styles.wineImageWrapper}>
                <Image
                  source={require('../../../assets/adega/vinho-seco.jpg')}
                  style={styles.wineImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.wineDetails}>
                <Text style={styles.wineTitle}>Elvio Cogno Ravera Barolo</Text>
                <Text style={styles.wineDescription}>
                  Vinho estruturado, com sabor de cereja vermelha madura, framboesa, notas de tabaco e taninos aveludados. Sua cor é vermelho-granada.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'contato' && (
          <ScrollView
            style={styles.contatoContainer}
            contentContainerStyle={styles.contatoScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.contatoTitle}>
              Entre em contato conosco para comprar nossos produtos
            </Text>

            {/* Telefone */}
            <View style={styles.contactCard}>
              <FontAwesome5
                name="phone-alt"
                size={30}
                color="#400303"
                style={styles.contactIcon}
              />
              <Text style={styles.contactLabel}>Telefone:</Text>
              <Text style={styles.contactValue}>+55 21 000000000</Text>
            </View>

            {/* Endereço */}
            <View style={styles.contactCard}>
              <FontAwesome5
                name="map-marker-alt"
                size={32}
                color="#400303"
                style={styles.contactIcon}
              />
              <Text style={styles.contactLabel}>Endereço:</Text>
              <Text style={styles.contactValue}>Av. 123, 222 - Rio de Janeiro RJ</Text>
            </View>

            {/* Email */}
            <View style={styles.contactCard}>
              <FontAwesome5
                name="envelope"
                size={30}
                color="#400303"
                style={styles.contactIcon}
              />
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>preferida@adega.com.br</Text>
            </View>

            {/* Instagram */}
            <View style={styles.contactCard}>
              <FontAwesome5
                name="instagram"
                size={32}
                color="#400303"
                style={styles.contactIcon}
              />
              <Text style={styles.contactLabel}>Instagram:</Text>
              <Text style={styles.contactValue}>@adegapreferida</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        {/* Aba Início */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'inicio' ? styles.tabItemActive : null,
          ]}
          onPress={() => setActiveTab('inicio')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="home"
            size={20}
            color={activeTab === 'inicio' ? '#400303' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'inicio' ? styles.tabLabelActive : null,
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        {/* Aba Catálogo */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'catalogo' ? styles.tabItemActive : null,
          ]}
          onPress={() => setActiveTab('catalogo')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="wine-bottle"
            size={20}
            color={activeTab === 'catalogo' ? '#400303' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'catalogo' ? styles.tabLabelActive : null,
            ]}
          >
            Catálogo
          </Text>
        </TouchableOpacity>

        {/* Aba Contato */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'contato' ? styles.tabItemActive : null,
          ]}
          onPress={() => setActiveTab('contato')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="address-card"
            size={20}
            color={activeTab === 'contato' ? '#400303' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'contato' ? styles.tabLabelActive : null,
            ]}
          >
            Contato
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
