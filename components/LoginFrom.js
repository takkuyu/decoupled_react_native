import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity
} from 'react-native';
import { getAuthClient } from '../utils/auth';
const auth = getAuthClient();

const LoginForm = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({ name: '', pass: '' });
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const isAuthenticated = auth.isLoggedIn();
    if (isAuthenticated) {
      setLoggedIn(true);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);

    auth.login(values.name, values.pass)
      .then(() => {
        setSubmitting(false);
        setLoggedIn(true);
      })
      .catch((error) => {
        setSubmitting(false);
        setLoggedIn(false);
        console.log('Login error', error);
      });
  };

  if (isLoggedIn) {
    return (
      <View>
        <Text>You're currently logged in.</Text>
        <Button
          onPress={() => auth.logout().then(setLoggedIn(false))}
          title="Logout"
        />
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View>
        <Text>Logging in, hold tight ...</Text>
      </View>
    )
  }

  return (
    <View>
      <View onSubmit={handleSubmit}>
        <TextInput
          name="name"
          value={values.name}
          placeholder="Username"
          onChangeText={(value) => setValues({ ...values, ['name']: value })}
          style={styles.Input}
        />
        <TextInput
          name="pass"
          value={values.pass}
          placeholder="Password"
          onChangeText={(value) => setValues({ ...values, ['pass']: value })}
          style={styles.Input}
        />
        <Button
          style={styles.InputButton}
          onPress={handleSubmit}
          title="Login"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  Input: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  InputButton: {
    padding: 15,
    width: 100,
    color: '#fff',
    textAlign: 'center',
    borderRadius: 3,
    backgroundColor: 'gray',
  },
  listItemText: {
    fontSize: 18,
  }
})

export default LoginForm;