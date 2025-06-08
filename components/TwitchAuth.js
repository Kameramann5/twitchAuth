import React, {useState, useEffect, useRef, useCallback} from 'react';
import { View, Text, StyleSheet, Button, Linking, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENT_ID = 'ciicbxp57ut6cvt2lh4s9b817v8bzt';
const REDIRECT_URI = 'https://glebs-dev.ru/';
const AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email`;

export default function TwitchLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.data?.length > 0) {
        const userLogin = data.data[0].login;
        setUsername(userLogin);
        setLoggedIn(true);
        await AsyncStorage.setItem('twitch_username', userLogin);
        console.log('Логин Twitch:', userLogin);
      } else {
        setError('Не удалось получить данные пользователя');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const parseHashParams = (hash) => {
    const result = {};
    const pairs = hash.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      result[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return result;
  };

  const handleUrl = useCallback(async (event) => {
    try {
      const url = event?.url ?? event;
      console.log('Обработка URL:', url);
      if (url.startsWith('myapp://auth') && url.includes('#')) {
        const hashPart = url.split('#')[1];
        const params = parseHashParams(hashPart);
        const token = params['access_token'];

        if (token) {
          await AsyncStorage.setItem('twitch_token', token);
          await fetchUserInfo(token);
        } else {
          console.warn('Токен не найден в URL');
        }
      }
    } catch (err) {
      console.error('Ошибка в handleUrl:', err);
    }
  }, []);

  const checkInitialUrl = useCallback(async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      console.log('Initial URL:', initialUrl);
      if (initialUrl?.startsWith('myapp://auth')) {
        await handleUrl({ url: initialUrl });
      }
    } catch (err) {
      console.error('Ошибка при получении initial URL:', err);
    }
  }, [handleUrl]);

  useEffect(() => {
    const init = async () => {
      const storedToken = await AsyncStorage.getItem('twitch_token');
      if (storedToken) {
        await fetchUserInfo(storedToken);
      }
      await checkInitialUrl();
    };

    init();

    const linkingSubscription = Linking.addListener('url', handleUrl);

    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
      ) {
        console.log('Приложение снова активно. Проверяем URL...');
        await checkInitialUrl();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      linkingSubscription.remove();
      appStateSubscription.remove();
    };
  }, [checkInitialUrl, handleUrl]);

  const handleLogin = async () => {
    try {
      await Linking.openURL(AUTH_URL);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть браузер');
    }
  };

  const handleReturn = async () => {
    await AsyncStorage.multiRemove(['twitch_username', 'twitch_token']);
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
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  welcome: { fontSize: 20, textAlign: 'center', marginBottom: 20 },
});
