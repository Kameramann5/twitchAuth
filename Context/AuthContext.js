import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Здесь будет храниться информация о пользователе
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загружаем данные из AsyncStorage при старте
  useEffect(() => {
    const loadData = async () => {
      const storedUser = await AsyncStorage.getItem('twitch_username');
      const storedToken = await AsyncStorage.getItem('twitch_token');
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const login = async (userName, userToken) => {
    setUser(userName);
    setToken(userToken);
    await AsyncStorage.setItem('twitch_username', userName);
    await AsyncStorage.setItem('twitch_token', userToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(['twitch_username', 'twitch_token']);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
