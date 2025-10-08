import React, { useState, useCallback } from 'react';
import { View, Button, TextInput, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorCode, setErrorCode] = useState(null);

    const onSignIn = () => {
        signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
            .catch((error) => {
                if (error.code === "auth/invalid-email" || error.code === "auth/invalid-credential" || error.code === "auth/missing-password") {
                    setErrorCode("Invalid email and/or password.");
                }
                else {
                    console.error("Error logging in:", error);
                }
            });
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={styles.container}>
                    <View style={styles.topContainer}>
                        <TouchableOpacity onPress={navigation.goBack}>
                            <Ionicons name='chevron-back' size={32} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.loginContainer}>
                            <View style={styles.topSpacer} />
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Login</Text>
                                <Text style={styles.welcome}>Welcome back</Text>
                            </View>
                            <View style={styles.midSpacer} />
                            <View style={styles.formContainer}>
                                <Text style={styles.label}>Email</Text>
                                {errorCode && <Text style={styles.errorMessage}>{errorCode}</Text>}
                                <TextInput
                                    placeholder="hello@example.com"
                                    placeholderTextColor={'#C7C7CD'}
                                    onChangeText={setEmail}
                                    style={styles.textBox}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                />
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={password}
                                    onChangeText={setPassword}
                                    style={styles.textBox}
                                    secureTextEntry
                                    textContentType="password"
                                    returnKeyType="go"
                                    onSubmitEditing={onSignIn}
                                />
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.loginButton}
                                        onPress={onSignIn}
                                    >
                                        <Text style={styles.loginText}>Login</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.replace("Register")}
                                    >
                                        <Text style={styles.signUpText}>Create an account</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.bottomSpacer} />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    scroll: {
        flexGrow: 1,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'space-between'
    },
    topSpacer: {
        flex: 1,
        minHeight: 10,
    },
    titleContainer: {
        marginHorizontal: 30,
    },
    title: {
        fontSize: 32,
        color: colors.primary,
        fontFamily: fonts.bold,
        textAlign: 'left',
        marginBottom: 10
    },
    welcome: {
        fontSize: 18,
        color: colors.secondary,
        fontFamily: fonts.regular,
    },
    midSpacer: {
        flex: 1,
        minHeight: 40,
    },
    formContainer: {
        marginHorizontal: 30,
        marginTop: 0,
    },
    label: {
        fontSize: 18,
        marginBottom: 5,
        color: colors.primary,
        textAlign: 'left',
        fontFamily: fonts.bold
    },
    errorMessage: {
        fontFamily: fonts.regular,
        fontSize: 14,
        marginBottom: 5,
        color: colors.red,
        textAlign: 'left',
    },
    textBox: {
        fontSize: 16,
        borderRadius: 15,
        width: '100%',
        height: 50,
        paddingHorizontal: 10,
        marginBottom: 20,
        backgroundColor: colors.surface,
        fontFamily: fonts.regular,
        color: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    loginButton: {
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent,
        borderRadius: 30,
        marginTop: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
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
    smallButton: {
        fontSize: 12,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    bottomSpacer: {
        flex: 1,
        minHeight: 150
    },
});

export default Login;
