import React, {useState,useEffect} from 'react';
import { StyleSheet,SafeAreaProvider,StatusBar  } from 'react-native';
import { gStyle } from './styles/style';
import MainStack from './navigate';


export default function App() {
     // Заблокировать ориентацию по умолчанию (например, только портрет)
return (
      <>
      <StatusBar  barStyle="light-content"  backgroundColor="#8c3fff" />
      <MainStack /> 
      </>
)
}
const styles = StyleSheet.create({
});