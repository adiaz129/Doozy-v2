import React, { useState, useEffect } from 'react';
import { Alert, View, Button, TextInput, Keyboard, TouchableWithoutFeedback, StyleSheet, Text, KeyboardAvoidingView, Platform, ImageBackground, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { EmailAuthProvider, updateEmail, updatePassword, reauthenticateWithCredential, verifyBeforeUpdateEmail, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { deleteUserProfile } from '../utils/deleteUserFunctions';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Settings() {
    const [userProfile, setUserProfile] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [isReauthVisible, setReauthVisible] = useState(false);
    const [isError, setError] = useState(false);
    const [isLogOutModalVisible, setLogOutModalVisible] = useState(false);
    const currentUser = FIREBASE_AUTH.currentUser;
    const navigation = useNavigation();

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        if (currentUser) {
            const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);

            try {
                const docSnapshot = await getDoc(userProfileRef);
                if (docSnapshot.exists()) {
                    setUserProfile(docSnapshot.data());
                }
            } catch (error) {
                console.error('Error fetching user profile: ', error);
            }
        }
    };

    const updateUserProfile = async () => {
        if (currentUser) {
            const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);

            try {
                await updateDoc(userProfileRef, {
                    name: name,
                });

                if (email || password) {
                    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
                    await reauthenticateWithCredential(currentUser, credential);

                    if (email) {
                        await verifyBeforeUpdateEmail(currentUser, email);
                        console.log("Email verification sent!");

                        while (!currentUser.emailVerified) {
                            await currentUser.reload();
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                        await updateDoc(userProfileRef, {
                            email: email,
                        });

                        await updateEmail(currentUser, email);
                        console.log('Email updated!');
                    }

                    if (password) {
                        await updatePassword(currentUser, password);
                        console.log('Password updated!');
                    }
                }

                console.log('Profile updated!');
            } catch (error) {
                console.error('Error updating profile: ', error);
            }
        }
    };

    const updateUserPassword = async () => {
        try {
            await sendPasswordResetEmail(FIREBASE_AUTH, userProfile.email);
            Alert.alert("Success!", "A password reset email has been sent to your inbox.");
        } catch (error) {
            console.error("Error sending password reset email:", error);
        }


    }

    const onLogout = () => {
        signOut(FIREBASE_AUTH)
            .then(() => {
                console.log("User signed out");
            })
            .catch(error => {
                console.error("Error signing out: ", error);
            });
    };

    const deleteUser = async () => {
        try {
            await deleteUserProfile(email, password);
        } catch (error) {
            setError(true);
        }
    }

    const cancelConfirmation = async () => {
        setEmail("");
        setPassword("");
        setError(false);
        setReauthVisible(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={isLogOutModalVisible}
                transparent={true}
                animationType='fade'
            >
                <ConfirmationModal
                    confirm={()=>{ setLogOutModalVisible(false); onLogout()}}
                    deny={()=>{setLogOutModalVisible(false)}}
                    cancel={() => {}}
                    title={"Confirm Logout?"}
                    description={"You will need to log in again to access your account."}
                    confirmText={"Logout"}
                    denyText={"Cancel"}
                    confirmColor={colors.red}
                    denyColor={colors.primary}
                />
            </ Modal>
            <Modal
                visible={isReauthVisible}
                transparent={true}
                animationType='fade'
            >
                <TouchableWithoutFeedback onPress={cancelConfirmation}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.reauthContainer}>
                                <Text style={styles.reauthTitle}>You must reauthenticate to delete your account</Text>
                                {isError && <Text style={styles.error}>Incorrect email or password</Text>}
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    placeholder="hello@example.com"
                                    onChangeText={setEmail}
                                    style={styles.textBox}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    autoFocus={true}
                                />
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    style={styles.textBox}
                                    secureTextEntry
                                    textContentType="password"
                                    returnKeyType="go"
                                    onSubmitEditing={deleteUser}
                                />
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.confirmDeleteButton}
                                        onPress={deleteUser}
                                    >
                                        <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelConfirmation}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <View style={styles.topContainer}>
                <TouchableOpacity onPress={navigation.goBack} style={{ width: 50 }}>
                    <Ionicons name='chevron-back' size={24} color={colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Settings</Text>
                </View>
                <View style={{ width: 50 }} />
            </View>
            <Button
                onPress={updateUserPassword}
                title="Update Password"
                color="#007AFF"
            />
            <Button
                onPress={() => setReauthVisible(true)}
                title="Delete Account"
                color="#007AFF"
            />
            <Button
                onPress={()=>setLogOutModalVisible(true)}
                title="Logout"
                color={colors.red}
            />
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    overlay: {
        flex: 1,
        paddingTop: 100,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
    },
    reauthContainer: {
        padding: 10,
        backgroundColor: colors.background,
        borderRadius: 10,
        width: '80%',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    reauthTitle: {
        fontSize: 20,
        fontFamily: fonts.bold,
        color: colors.primary,
        paddingBottom: 10,
        textAlign: 'center',
    },
    error: {
        fontSize: 18,
        color: colors.red,
        fontFamily: fonts.regular,
    },
    label: {
        fontSize: 18,
        marginBottom: 5,
        color: colors.primary,
        textAlign: 'left',
        fontFamily: fonts.bold,
    },
    textBox: {
        fontSize: 16,
        borderRadius: 15,
        width: '100%',
        height: 40,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmDeleteButton: {
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.red,
        borderRadius: 30,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    confirmDeleteButtonText: {
        fontSize: 20,
        color: colors.button_text,
        fontFamily: fonts.bold,
    },
    cancelButton: {
        width: '80%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.fade,
        borderRadius: 30,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    cancelButtonText: {
        fontSize: 20,
        color: colors.button_text,
        fontFamily: fonts.bold,
    },
    topContainer: {
        marginHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontFamily: fonts.bold,
        color: colors.primary,
        fontSize: 18,
    },

});
