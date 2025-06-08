import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  AppState,
  Button,
  Switch,
} from "react-native"; // Импортируем AppState
import { WebView } from "react-native-webview";
import { useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { AuthContext } from "../Context/AuthContext";
import Icon from "@react-native-vector-icons/ionicons";

function StreamerLive({ route, navigation }) {
  const { userName } = route.params;
  const appState = useRef(AppState.currentState);
  const [appIsActive, setAppIsActive] = useState(true);
  const webViewRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [isPaused, setIsPaused] = useState(false); // состояние для паузы/игры
  const [showButtons, setShowButtons] = useState(false);
  const timeoutRef = useRef(null);
  const { CustomPlayer } = useContext(SwitchContext);
  const { token } = useContext(AuthContext);
  const [isSoundOn, setIsSoundOn] = React.useState(true);

  useEffect(() => {
    navigation.setOptions({
      /*headerShown: !isLandscape,*/
      headerShown: false,
    });
  }, [isLandscape, navigation]);

  const handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      setAppIsActive(true);
    } else if (nextAppState.match(/inactive|background/)) {
      setAppIsActive(false);
    }
    appState.current = nextAppState;
  };

  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: "none" },
      });
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: { display: "flex" },
        });
      };
    }, [navigation])
  );

  console.log({ token });

  const parentDomain = "twitch-auth.ru";
  const twitchEmbedUrl = `https://player.twitch.tv/?channel=${userName}&controls=${
    CustomPlayer ? "false" : "true"
  }&parent=${parentDomain}`;
  const twitchChatUrl = `https://www.twitch.tv/embed/${userName}/chat?parent=${parentDomain}&auth_token=${token}`;
  const key = appIsActive ? "active" : "paused";

  // Показываем кнопки при нажатии на WebView, скрываем через 3 секунды
  const onWebViewPress = () => {
    setShowButtons(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowButtons(false);
    }, 3000);
  };
  const handlePausePlay = () => {
    if (isPaused) {
      // Возобновляем трансляцию
      setIsPaused(false);
    } else {
      // Пауза
      setIsPaused(true);
    }
  };
  const changeQuality = (quality) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ quality }));
    }
  };

  const injectedJavaScript = `
    (function() {
      window.changeQuality = function(quality) {
        if (window.twitchPlayer) {
          window.twitchPlayer.setQuality(quality);
        }
      };
      document.addEventListener('message', function(event) {
        var data = JSON.parse(event.data);
        if (data.quality) {
          window.changeQuality(data.quality);
        }
      });
    })();
  `;

  return (
    <View style={styles.container}>
      {appIsActive ? (
        <View
          style={[
            styles.streamContainer,
            isLandscape ? styles.landscape : styles.portrait,
          ]}
        >
          {isLandscape && <StatusBar hidden />}
          {!isLandscape && (
            <StatusBar backgroundColor="black" barStyle="light-content" />
          )}
          <View style={[isLandscape ? styles.customHor : styles.customVert]}>
            {/* Оборачиваем WebView в TouchableWithoutFeedback, чтобы отлавливать нажатия */}
            <TouchableWithoutFeedback onPress={onWebViewPress}>
              <View style={{ flex: 1 }}>
                {isPaused ? (
                  // Если на паузе, показываем серый фон
                  <View
                    style={[
                      styles.webview,
                      styles.grayBackground,
                      styles.centered,
                    ]}
                  >
                    <Icon
                      name="pause"
                      style={styles.pausedText}
                      size={40}
                      color="#999"
                    />
                  </View>
                ) : (
                  <WebView
                    key={key}
                    ref={webViewRef}
                    source={{ uri: twitchEmbedUrl }}
                    style={
                      isLandscape ? styles.webviewLandscape : styles.webview
                    }
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    injectedJavaScript={injectedJavaScript}
                  />
                )}

                {showButtons && CustomPlayer && (
                  <View style={styles.overlay}>
                    <View style={styles.overlayTop}>
                      <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon
                          name="arrow-back"
                          style={styles.icon}
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon
                          name="information"
                          style={styles.icon}
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.overlayBottom}>
                      <TouchableOpacity onPress={() => changeQuality(360)}>
                        <Text>360</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => changeQuality(720)}>
                        <Text>720</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
          {!isLandscape && (
            <WebView
              source={{ uri: twitchChatUrl }}
              style={styles.chatWebview}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUser
              Action={false}
            />
          )}
        </View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  OverlayWhiteText: {
    color: "white",
  },
  viewersCount: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  duration: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  centered: {
    justifyContent: "center", // вертикальное центрирование
    alignItems: "center", // горизонтальное центрирование
  },
  customVert: {
    flex: 0,
    height: 220,
  },
  customHor: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  streamContainer: {
    flex: 1,
    flexDirection: "column",
  },
  portrait: {
    flexDirection: "column",
  },
  landscape: {
    flexDirection: "row",
  },
  webview: {
    flex: 2,
  },
  webviewLandscape: {
    flex: 1,
  },
  chatWebview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlayTop: {
    gap: 10,
    justifyContent: "flex-start",
    flexDirection: "row",
    padding: 10,
  },
  overlayBottom: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    justifyContent: "flex-start",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", // полупрозрачный фон
    flexDirection: "column",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#8c3fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    opacity: 0.9,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default StreamerLive;
