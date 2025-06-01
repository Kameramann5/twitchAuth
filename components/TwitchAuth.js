import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENT_ID = 'ciicbxp57ut6cvt2lh4s9b817v8bzt'; // ваш client_id
const REDIRECT_URI = 'myapp://auth'; // схема вашего deep linking
const AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;

export default function TwitchLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null); // Добавлено для ошибок
  const accessToken = ''; //токен юзера полученный из браузера новый

  useEffect(() => {
    // Получение информации о пользователе
    const fetchUserInfo = async (token) => {
      try {
        const response = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const userLogin = data.data[0].login;
          setUsername(userLogin);
          setLoggedIn(true);
          await AsyncStorage.setItem('twitch_username', userLogin);
          console.log('Логин Twitch:', userLogin);
        } else {
          setError('Не удалось получить данные пользователя');
        }
      } catch (error) {
        setError(error.message);
      }
    };

    // Проверяем сохраненное состояние авторизации
    (async () => {
      const savedUser = await AsyncStorage.getItem('twitch_username');
      if (savedUser) {
        setUsername(savedUser);
        setLoggedIn(true);
      }
    })();

    // Обработчик для deep link
    const handleUrl = async (event) => {
      const url = event.url;
      if (url.startsWith(REDIRECT_URI)) {
        const hashPart = url.split('#')[1]; // получаем часть после #
        const params = new URLSearchParams(hashPart);
        const token = params.get('access_token');
        if (token) {
          await fetchUserInfo(token);
        }
      }
    };

    // Используем правильный способ добавления слушателя
    const subscription = Linking.addEventListener('url', handleUrl);

    // Проверка, был ли запуск через deep link
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.startsWith(REDIRECT_URI)) {
        handleUrl({ url: initialUrl });
      }
    })();

    // Удаляем слушатель при размонтировании компонента
    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await Linking.openURL(AUTH_URL);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось открыть браузер');
    }
  };

  const handleReturn = async () => {
    await AsyncStorage.removeItem('twitch_username');
    setLoggedIn(false);
    setUsername('');
  };

  return (
    <View style={styles.container}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {loggedIn ? (
        <View>
          <Text style={styles.welcome}>Привет, {username}!</Text>
          <Button title="Выйти" onPress={handleReturn} />
        </View>
      ) : (
        <View>
          <Text>Логин пользователя: {username}</Text>
          <Button title="Войти через Twitch" onPress={handleLogin} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
});
