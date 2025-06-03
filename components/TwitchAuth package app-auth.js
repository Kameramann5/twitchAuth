import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { authorize } from 'react-native-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENT_ID = 'ciicbxp57ut6cvt2lh4s9b817v8bzt'; // ваш client_id
const CLIENT_SECRET = 'x025qx3ftdlx0hvf7zqywcs8j2dhk6'; // укажите ваш client_secret
const REDIRECT_URI = 'myapp://auth'; // должен совпадать с настройками в Twitch

const config = {
clientId: CLIENT_ID,
clientSecret: CLIENT_SECRET,
redirectUrl: REDIRECT_URI,
scopes: ['user:read:email'],
serviceConfiguration: {
authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
},
};

export default function TwitchLogin() {
const [loggedIn, setLoggedIn] = useState(false);
const [username, setUsername] = useState('');
const [error, setError] = useState(null);
const getValidAccessToken = async () => {
  // Здесь можно добавить логику проверки срока жизни токена,
  // либо просто пробовать обновить токен при ошибке 401
  let token = await AsyncStorage.getItem('accessToken');
  // Например, если токен отсутствует или истёк — обновляем
  if (!token) {
    token = await refreshToken();
  }
  return token;
};
const fetchUserInfo = async (token) => {
  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const userLogin = data.data[0].login;
      setUsername(userLogin);
      setLoggedIn(true);
      await AsyncStorage.setItem('twitch_username', userLogin);
    } else {
      setError('Не удалось получить данные пользователя');
    }
  } catch (err) {
    setError(err.message);
  }
};

useEffect(() => {
(async () => {
const savedUser = await AsyncStorage.getItem('twitch_username');
if (savedUser) {
setUsername(savedUser);
setLoggedIn(true);
}
})();
}, []);

const handleLogin = async () => {
  try {
    const result = await authorize(config);
    const refreshToken = async () => {
      try {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('Нет refresh токена');
    
        const newAuthState = await refresh(config, {
          refreshToken: storedRefreshToken,
        });
    
        await AsyncStorage.setItem('accessToken', newAuthState.accessToken);
        if (newAuthState.refreshToken) {
          await AsyncStorage.setItem('refreshToken', newAuthState.refreshToken);
        }
    
        return newAuthState.accessToken;
      } catch (err) {
        console.log('Ошибка обновления токена:', err);
        throw err;
      }
    };
    await AsyncStorage.setItem('accessToken', result.accessToken);
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
    await fetchUserInfo(result.accessToken);
  } catch (err) {
    console.log('Ошибка авторизации:', err);
    Alert.alert('Ошибка', 'Не удалось авторизоваться через Twitch');
  }
};

const handleLogout = async () => {
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
<Button title="Выйти" onPress={handleLogout} />
</View>
) : (
<View>
<Text>Вы не авторизованы</Text>
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