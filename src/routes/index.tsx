import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Hub from "../app/index";

// Tela de Início (Home)
function HomeScreen() {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <Ionicons name="home-outline" size={64} color="#047857" />
      <Text style={styles.screenTitle}>Tela de Início</Text>
      <Text style={styles.screenSubtitle}>
        Bem-vindo ao aplicativo de Desenvolvimento Mobile!
      </Text>
    </SafeAreaView>
  );
}

// Tela de Perfil (ProfileScreen)
function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <Ionicons name="person-circle-outline" size={72} color="#047857" />
      <Text style={styles.screenTitle}>Meu Perfil</Text>
      <Text style={styles.screenSubtitle}>Aluno / Desenvolvedor Mobile</Text>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export function BottomRoutes() {
  return (
    <Tab.Navigator
      initialRouteName="Início"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#8c8c8c",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Início") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Hub Links") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Meu Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Hub Links" component={Hub} />
      <Tab.Screen name="Meu Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default BottomRoutes;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
});