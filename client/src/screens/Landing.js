import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ImageBackground } from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import CheckedBox from '../assets/checked-post-sent.svg';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.title}>
          <CheckedBox width={84} height={84}/>
          <Text style={styles.appName}>Doozy</Text>
        </View>
        <Text style={styles.slogan}>check, share, repeat</Text>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.signUpText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  topContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
  },
  appName: {
    fontSize: 64,
    color: colors.primary,
    paddingRight: 10,
    fontFamily: fonts.bold,
  },
  slogan: {
    color: colors.second_accent,
    fontFamily: fonts.italic,
    fontSize: 18,
    marginBottom: 10,
  },
  bottomContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '60%',
  },
  loginButton: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 30,
    marginVertical: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 10,
  },
  loginText: {
    fontSize: 20,
    color: colors.button_text,
    fontFamily: fonts.bold,
  },
  signUpText: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: fonts.regular,
    textDecorationLine: 'underline'
  },
});
