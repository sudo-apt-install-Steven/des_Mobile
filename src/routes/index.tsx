import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GlassTabBar } from './GlassTabBar';
import HomeScreen from '../app/Atividade10_tabnav/home';
import Subpagina1 from '../app/Atividade10_tabnav/subpagina1';
import Subpagina2 from '../app/Atividade10_tabnav/subpagina2';
import Subpagina3 from '../app/Atividade10_tabnav/subpagina3';

const Tab = createBottomTabNavigator();

export function BottomRoutes() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Weight" component={Subpagina1} />
      <Tab.Screen name="Reports" component={Subpagina2} />
      <Tab.Screen name="Account" component={Subpagina3} />
    </Tab.Navigator>
  );
}

export default BottomRoutes;