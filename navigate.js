import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import TwitchAuth from './components/TwitchAuth';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function GamesStack() {
  return (
    <Stack.Navigator>
    </Stack.Navigator>
  );
}
const TwitchAuthName = "Вход";
export default function Main() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={TwitchAuthName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName;
         if (route.name === TwitchAuthName) {
              iconName = focused ? 'log-in' : 'log-in-outline';
            }
            return <Icon name={iconName} size={20} color={color} style={{ marginTop: 1 }} />;
          },
          tabBarActiveTintColor: '#8c3fff',
          tabBarInactiveTintColor: 'grey',
          tabBarLabelStyle: { paddingBottom: 5, fontSize: 10 },
          tabBarStyle: { padding: 0, height: 50 },
        })}
      >
            <Tab.Screen
          name={TwitchAuthName}
          component={TwitchAuth}
          options={{ headerShown: false }}
        /> 
      </Tab.Navigator>
    </NavigationContainer>
  );
}
