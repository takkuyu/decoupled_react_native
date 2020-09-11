import React from 'react';
import NodeReadWrite from './components/NodeReadWrite';
import LoginForm from './components/LoginFrom';
import {
  StyleSheet,
  View,
} from 'react-native';

const App = () => {
  return (
    <View style={styles.Container}>
      <LoginForm />
      <NodeReadWrite />
    </View>
  );
}

const styles = StyleSheet.create({
  Container:{
    marginTop: 50,
    padding: 15,
  },
})

export default App;
