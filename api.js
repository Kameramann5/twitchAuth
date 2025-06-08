import axios from 'axios';

// Введите свои ключи и токены сюда
const CLIENT_ID = 'ciicbxp57ut6cvt2lh4s9b817v8bzt';
const CLIENT_SECRET = 'x025qx3ftdlx0hvf7zqywcs8j2dhk6';

let ACCESS_TOKEN = 'k4o442mznei502mf7k50af2akm1qxm';
let REFRESH_TOKEN = '98720ev8c297gy8kgab40sw663425w2xy0jjywpsi2t0jimrll';

// Создаем axios-инстанс
const api = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': CLIENT_ID,
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  },
});

// Функция для обновления токена
async function refreshAccessToken() {
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token',
      },
    });

    // Обновляем токены
    ACCESS_TOKEN = response.data.access_token;
    if (response.data.refresh_token) {
      REFRESH_TOKEN = response.data.refresh_token;
    }

    // Обновляем заголовки
    api.defaults.headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
    console.log('Токен обновлен:', ACCESS_TOKEN);
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error.response ? error.response.data : error.message);
    throw error; // Можно выбросить ошибку, чтобы обработать её выше
  }
}

// Обработчик ошибок для автоматического рефреша
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // Проверяем, что ошибка связана с авторизацией
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // чтобы не зацикливать
      try {
        await refreshAccessToken();
        // После обновления токена повторяем исходный запрос
        originalRequest.headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
        return api(originalRequest);
      } catch (err) {
        // Обработка ошибок обновления токена (например, редирект на логин)
        console.error('Не удалось обновить токен:', err);
        // Можно выбросить ошибку или выполнить другую логику
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Изначально можно обновить токен при запуске
async function initializeToken() {
  await refreshAccessToken();
}
initializeToken();

export default api;
