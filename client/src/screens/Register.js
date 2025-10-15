import React, { useState, useContext } from 'react';
import { View, Button, TextInput, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, updateMetadata } from "firebase/storage";
import { FIREBASE_AUTH, FIRESTORE_DB, FIREBASE_STORAGE } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { checkNameField, checkPasswordField, checkUsernameField } from '../utils/checkFieldFunctions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../AuthContext';

const Register = () => {
    const navigation = useNavigation();
    const [errorCodeName, setErrorCodeName] = useState("");
    const [errorCodeUsername, setErrorCodeUsername] = useState("");
    const [errorCodeEmail, setErrorCodeEmail] = useState("");
    const [errorCodePassword, setErrorCodePassword] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const { setAuth } = useContext(AuthContext);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const onSignUp = async () => {
        const { name, email, username, password, confirmPassword } = formData;
        setErrorCodeName('');
        setErrorCodeUsername('');
        setErrorCodeEmail('');
        setErrorCodePassword('');
        try {
            const response = await axios.post('http://localhost:8800/api/auth/register', {name, email, password, username, confirmPassword});
            if (response.data.success) {
                await setAuth(response.data.token);
            }

        } catch (error) {
            for (let i = 0; i < error.response.data.errors.length; i++) {
                if (error.response.data.errors[i].path == "name") {
                    setErrorCodeName(error.response.data.errors[i].msg);
                }
                else if (error.response.data.errors[i].path === "username") {
                    setErrorCodeUsername(error.response.data.errors[i].msg);
                }
                else if (error.response.data.errors[i].path === "email") {
                    setErrorCodeEmail(error.response.data.errors[i].msg);
                }
                else {
                    setErrorCodePassword(error.response.data.errors[i].msg);
                }
            }
        }
    }

    const dismissKeyboard = () => Keyboard.dismiss();

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
                    >
                        <ScrollView contentContainerStyle={{flexGrow: 1}} automaticallyAdjustKeyboardInsets={true} keyboardShouldPersistTaps="handled">
                        <View style={styles.signUpContainer}>
                            <View style={styles.topSpacer} />
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Sign Up</Text>
                            </View>
                            <View style={styles.midSpacer} />
                            <View style={styles.formContainer}>
                                <Text style={styles.label}>Name</Text>
                                {errorCodeName && <Text style={styles.errorMessage}>{errorCodeName}</Text>}
                                <TextInput
                                    placeholder="John Doe"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.name}
                                    onChangeText={(text) => handleChange('name', text)}
                                    style={styles.textBox}
                                />

                                <Text style={styles.label}>Email</Text>
                                {errorCodeEmail && <Text style={styles.errorMessage}>{errorCodeEmail}</Text>}
                                <TextInput
                                    placeholder="johndoe@email.com"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.email}
                                    onChangeText={(text) => handleChange('email', text)}
                                    style={styles.textBox}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <Text style={styles.label}>Username</Text>
                                {errorCodeUsername && <Text style={styles.errorMessage}>{errorCodeUsername}</Text>}
                                <TextInput
                                    placeholder="johndoe123"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.username}
                                    onChangeText={(text) => handleChange('username', text)}
                                    style={styles.textBox}
                                    autoCapitalize="none"
                                />

                                <Text style={styles.label}>Password</Text>
                                {errorCodePassword && <Text style={styles.errorMessage}>{errorCodePassword}</Text>}
                                <TextInput
                                    placeholder="8+ characters, 1 number"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.password}
                                    onChangeText={(text) => handleChange('password', text)}
                                    style={styles.textBox}
                                    secureTextEntry
                                />
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    placeholder="Re-enter your password"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => handleChange('confirmPassword', text)}
                                    style={styles.textBox}
                                    secureTextEntry
                                    returnKeyType="go" // or "done"
                                    onSubmitEditing={onSignUp}
                                />
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.signUpButton}
                                        onPress={onSignUp}
                                    >
                                        <Text style={styles.signUpText}>Sign Up</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.replace("Login")}
                                    >
                                        <Text style={styles.loginText}>Already have an account? Log in</Text>
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
    signUpContainer: {
        flex: 1,
        justifyContent: 'space-between'
    },
    topSpacer: {
        flex: 1,
        minHeight: 10,
    },
    formContainer: {
        marginHorizontal: 30,
    },
    midSpacer: {
        flex: 1,
        minHeight: 10,
    },
    title: {
        fontFamily: fonts.bold,
        color: colors.primary,
        fontSize: 32,
        textAlign: 'left',
        marginHorizontal: 30,
    },
    label: {
        fontFamily: fonts.bold,
        fontSize: 18,
        marginBottom: 5,
        color: colors.primary,
        textAlign: 'left',
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
        fontFamily: fonts.regular,
        borderRadius: 15,
        width: '100%',
        height: 50,
        paddingHorizontal: 10,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    signUpButton: {
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent,
        borderRadius: 30,
        marginTop: 20,
        marginBottom: 30,
        fontFamily: fonts.regular,
        color: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    signUpText: {
        fontSize: 20,
        color: colors.button_text,
        fontFamily: fonts.bold,
    },
    loginText: {
        fontSize: 16,
        color: colors.secondary,
        fontFamily: fonts.regular,
        textDecorationLine: 'underline'
    },
    bottomSpacer: {
        flex: 1,
        minHeight: 0,
    }
});

export default Register;
