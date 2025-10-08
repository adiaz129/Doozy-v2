import React, { useState } from 'react';
import { View, Button, TextInput, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, updateMetadata } from "firebase/storage";
import { FIREBASE_AUTH, FIRESTORE_DB, FIREBASE_STORAGE } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { checkNameField, checkPasswordField, checkUsernameField } from '../utils/checkFieldFunctions';

const Register = () => {
    const navigation = useNavigation();
    const [errorCode, setErrorCode] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const onSignUp = async () => {
        const { name, email, username, password, confirmPassword } = formData;
        try {
            await checkNameField(name);
            await checkUsernameField(username);
            await checkPasswordField(password, confirmPassword);
            const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
            const user = userCredential.user;

            // Create user document
            await setDoc(doc(FIRESTORE_DB, "Users", user.uid), {
                name,
                email,
                username,
                usernameLower: username.toLowerCase(),
                posts: 0,
                tasks: 0,
                friends: 0,
                bio: "",
                profilePic: "https://firebasestorage.googleapis.com/v0/b/doozy-3d54c.appspot.com/o/profilePics%2Fdefault.jpg?alt=media&token=c4b20aae-830c-4d47-aa90-2a3ebd6e16fb"
            });

            // Update storage metadata
            const forestRef = ref(FIREBASE_STORAGE, 'profilePics/default.jpg');
            await updateMetadata(forestRef, { cacheControl: 'public,max-age=31536000' });

        } catch (error) {
            switch(error.code) {
                case "name-required":
                    setErrorCode(['name', error.message]);
                    break;
                case "username-required":
                    setErrorCode(['username', error.message]);
                    break;
                case "username-taken":
                    setErrorCode(['username', error.message]);
                    break;
                case "password-required":
                    setErrorCode(['password', error.message]);
                    break;
                case "password-mismatch":
                    setErrorCode(['password', error.message]);
                    break;
                case "auth/password-does-not-meet-requirements":
                    setErrorCode(['password', "Password must be at least 6 characters."]);
                    break;
                case "auth/invalid-email":
                    setErrorCode(['email', "Email must be in the format: user@example.com."]);
                    break;
                case "auth/missing-email":
                    setErrorCode(['email', "Email required."]);
                    break;
                case "auth/email-already-in-use":
                    setErrorCode(['email', "Email is already registered. Log in or use a different email."])
                    break;
                default:
                    console.error("Registration failed: ", error);
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
                                {errorCode && errorCode[0] == "name" && <Text style={styles.errorMessage}>{errorCode[1]}</Text>}
                                <TextInput
                                    placeholder="John Doe"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.name}
                                    onChangeText={(text) => handleChange('name', text)}
                                    style={styles.textBox}
                                />

                                <Text style={styles.label}>Email</Text>
                                {errorCode && errorCode[0] == "email" && <Text style={styles.errorMessage}>{errorCode[1]}</Text>}
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
                                {errorCode && errorCode[0] == "username" && <Text style={styles.errorMessage}>{errorCode[1]}</Text>}
                                <TextInput
                                    placeholder="johndoe123"
                                    placeholderTextColor={'#C7C7CD'}
                                    value={formData.username}
                                    onChangeText={(text) => handleChange('username', text)}
                                    style={styles.textBox}
                                    autoCapitalize="none"
                                />

                                <Text style={styles.label}>Password</Text>
                                {errorCode && errorCode[0] == "password" && <Text style={styles.errorMessage}>{errorCode[1]}</Text>}
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
