import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import api from "../api"; // предположим, что это axios или подобный api
import { useNavigation } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "@react-native-vector-icons/ionicons";

function Stream() {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [streamersCount, setStreamersCount] = useState(0);
  const navigation = useNavigation();
  const [streamerList, setStreamerList] = useState([]); // список добавленных стримеров

  const languages = [
    { label: "Все", value: "all" },
    { label: "Русский", value: "ru" },
    { label: "Английский", value: "en" },
  ];

  // Загрузка списка стримеров из AsyncStorage
  const loadStreamerList = async () => {
    try {
      const storedList = await AsyncStorage.getItem("streamerList");
      const list = storedList ? JSON.parse(storedList) : [];
      setStreamerList(list);
    } catch (error) {
      console.error("Ошибка при загрузке списка:", error);
    }
  };

  useEffect(() => {
    loadStreamerList();
  }, []);

  // Общий fetch данных
  useEffect(() => {
    fetchStreams(languageFilter);
  }, [languageFilter]);

  const fetchStreams = async (lang = "all") => {
    setLoading(true);
    try {
      let url = "https://api.twitch.tv/helix/streams?first=100";
      if (lang !== "all") {
        url += `&language=${lang}`;
      }
      const result = await api.get(url);
      let dataArray = result.data.data;

      // Получаем массив game_id
      let gameIDs = [...new Set(dataArray.map((stream) => stream.game_id))];

      // Формируем запрос к API для имён игр
      let baseURL = "https://api.twitch.tv/helix/games?";
      let queryParams = gameIDs.map((id) => `id=${id}`).join("&");
      let finalURL = `${baseURL}${queryParams}`;

      const gameNamesResult = await api.get(finalURL);
      let gameNameArray = gameNamesResult.data.data;

      // Обогащаем стримы именами игр и изменяем URL миниатюры
      const enrichedStreams = dataArray.map((stream) => {
        const game = gameNameArray.find((name) => name.id === stream.game_id);
        const gameName = game ? game.name : "Unknown";

        const thumbnail_url = stream.thumbnail_url
          .replace("{width}", "400")
          .replace("{height}", "200");

        return {
          ...stream,
          gameName,
          thumbnail_url,
          description: stream.title,
        };
      });

      // Фильтр по языку
      let filteredStreams = enrichedStreams; // Используем обогащённые данные
      if (lang !== "all") {
        filteredStreams = enrichedStreams.filter(
          (stream) => stream.language === lang
        );
      }

      // Подсчет уникальных стримеров
      const uniqueStreamers = new Set(
        filteredStreams.map((stream) => stream.user_name)
      );
      setStreamersCount(uniqueStreamers.size);
      setChannels(filteredStreams);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Функция для вычисления времени трансляции
  const getStreamDuration = (started_at) => {
    if (!started_at) return "00:00";

    const start = new Date(started_at);
    const now = new Date();
    const diffMs = now - start;

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hDisplay = hours > 0 ? String(hours).padStart(2, "0") + ":" : "";
    const mDisplay = String(minutes).padStart(2, "0") + ":";
    const sDisplay = String(seconds).padStart(2, "0");

    return hDisplay + mDisplay + sDisplay;
  };

  // Обработчик для кнопки "Русский"
  const handleRussianButton = () => {
    setLanguageFilter("ru");
    fetchStreams("ru");
  };
  // Обработчик для кнопки "Русский"
  const handleEnglishButton = () => {
    setLanguageFilter("en");
    fetchStreams("en");
  };

  return (
    <ScrollView>
      <Text>Топ стримеров </Text>
      {loading ? (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#8c3fff" />
          <Text>Топ ещё загружается...</Text>
        </View>
      ) : (
        <>
          {channels.map((channel, index) => (
            <View key={index} style={styles.card}>
              <Image
                source={{ uri: channel.thumbnail_url }}
                style={styles.image}
              />
              <View style={styles.cardBody}>
                <Text style={styles.gameName}>{channel.gameName}</Text>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    navigation.navigate("StreamerLive", {
                      userName: channel.user_login,
                    })
                  }
                >
                  <Text style={styles.buttonText}>{channel.user_name}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewContainerInnerText: {
    fontSize: 13,
  },
  viewContainerInner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 5,
  },
  viewContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    alignContent: "space-between",
    gap: 10,
  },

  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 200,
  },
  cardBody: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gameName: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
  },
  viewers: {
    fontSize: 14,
    color: "#777",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#8c3fff",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
  },

  languageButtonsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  languageButtonActive: {
    backgroundColor: "#8c3fff",
  },
  languageButtonText: {
    color: "#000",
  },
  languageButtonTextActive: {
    color: "#fff",
  },
  paginationContainer: {
    flexDirection: "row",
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    alignContent: "center",
  },
  pageButton: {
    padding: 8,
    backgroundColor: "#8c3fff",
    borderRadius: 4,
    marginHorizontal: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  pageInfo: {
    padding: 8,
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
});

export default Stream;
