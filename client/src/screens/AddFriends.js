import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addFriend, deleteRequest, deletePendingRequest, deleteFriend, requestUser, fetchFriends, fetchRequests, fetchProfiles } from '../utils/friendFunctions'
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import axios from 'axios';

const AddFriendsScreen = ({ navigation }) => {

    const [friends, setFriends] = useState([]);
    const [reqFriends, setReqFriends] = useState([]); // received requests
    const [requesting, setRequesting] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [searchProfilesText, setSearchProfilesText] = useState("");
    const unsubscribeRef = useRef([]);

    useEffect(() => {
        fetchReqData = async () => {
            setReqFriends(await fetchRequests());
        }
        fetchReqData();
    }, [])

    useFocusEffect(
        useCallback(() => {
            const backToScreen = async () => {
                if (searchProfilesText) {
                    await searchProfiles(searchProfilesText);
                }
                else {
                    setReqFriends(await fetchRequests());
                }
            }
            backToScreen();
        }, [])
    );

    useEffect(() => {
        if (!searchProfilesText) {
            setProfiles([])
        }
        const searchDelay = setTimeout(async () => {
            if (searchProfilesText) {
                await searchProfiles(searchProfilesText);
            }
        }, 300);

        return () => clearTimeout(searchDelay);
    }, [searchProfilesText]);

    const searchProfiles = async (query) => {
        const response = await axios.get(`http://localhost:8800/api/users/search?q=${query}`);
        setProfiles(response.data.body);
    }

    const deleteRequestHelper = async (userId) => {
        const result = await deleteRequest(userId);
        if (result) {
            setReqFriends(prev => prev.filter(item => item.user_id !== userId))
        }
    }

    const addFriendHelper = async (userId) => {
        const result = await addFriend(userId);
        if (result) {
            setReqFriends(prev => prev.filter(item => item.user_id !== userId));
        }
    }

    const requestUserHelper = async (userId) => {
        const result = await requestUser(userId);
        if (result) {
            setProfiles(prev => prev.map(item => item.user_id === userId ? {...item, friendStatus: result} : item));
        }
    }

    const deletePendingRequestHelper = async (userId) => {
        const result = await deletePendingRequest(userId);
        if (result) {
            setProfiles(prev => prev.map(item => item.user_id === userId ? {...item, friendStatus: result} : item));
        }
    }

    const ProfileCard = ({ item }) => (
        <TouchableOpacity onPress={() => { navigation.navigate('Profile', { userID: item.user_id, setProfiles: setProfiles, setReqFriends: setReqFriends }) }} style={styles.profileCard}>
            <View style={styles.userInfo}>
                <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
                <View style={styles.profileCardNames}>
                    <Text style={styles.nameText}> {item.name} </Text>
                    <Text style={styles.usernameText}> {item.friendStatus === "userReceivedRequest" ? "wants to be friends" : item.username} </Text>
                </View>
            </View>
            {item.friendStatus === "userReceivedRequest" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity style={styles.deleteButton} onPress={async () => { await deleteRequestHelper(item.user_id) }}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={async () => { await addFriendHelper(item.user_id) }}>
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
                )}
            {item.friendStatus === "userSentRequest" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity style={styles.requestedButton} onPress={async () => { await deletePendingRequestHelper(item.user_id) }}>
                        <Text style={styles.confirmButtonText}>Requested</Text>
                    </TouchableOpacity>
                </View>
                )}
            {item.friendStatus === "stranger" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity onPress={async () => { await requestUserHelper(item.user_id)}} style={{padding: 5}}>
                        <Ionicons name={"person-add"} size={26} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topContainer}>
                <TouchableOpacity onPress={navigation.goBack}>
                    <Ionicons name='chevron-back' size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.searchBrowseContainer}>
                <View style={styles.searchBoxContainer}>
                    <TextInput
                        placeholder='Search Profiles...'
                        placeholderTextColor={'#C7C7CD'}
                        style={styles.searchBox}
                        onChangeText={setSearchProfilesText}
                    />
                </View>
                {searchProfilesText === "" && (
                    <View style={styles.profileCardContainer}>
                        <FlatList
                            data={reqFriends}
                            renderItem={ProfileCard}
                            keyExtractor={(item) => item.user_id}
                            keyboardShouldPersistTaps="handled" />
                    </View>)}
                {searchProfilesText !== "" &&
                    (
                        <View style={styles.profileCardContainer}>
                            <FlatList
                                data={profiles}
                                renderItem={ProfileCard}
                                keyExtractor={(item) => item.user_id} 
                                keyboardShouldPersistTaps="handled"/>
                        </View>)}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    topContainer: {
        marginHorizontal: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBrowseContainer: {
        flex: 1,
    },
    searchBoxContainer: {
        backgroundColor: colors.surface,
        borderRadius: 15,
        margin: 5,
        height: 40,
        flexDirection: "row",
        alignItems: "center",

    },
    searchBox: {
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 18,
        textAlign: 'left',
        textAlignVertical: 'center',
        includeFontPadding: false,
        width: '100%'
    },
    profileCardContainer: {
        flex: 1,
    },
    profileCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,

    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    profileCardNames: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    profilePic: {
        marginLeft: 10,
        marginRight: 10,
        height: 60,
        width: 60,
        borderRadius: 50,
    },
    nameText: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    usernameText: {
        fontSize: 12,
        color: colors.fade,
        fontFamily: fonts.regular
    },
    requestConfirmationButtons: {
        flexDirection: "row",
        marginRight: 10,
    },
    requestedButton: {
        backgroundColor: colors.accent,
        borderRadius: 20,
        minWidth: 100,
        height: 30,
        justifyContent: 'center',
    },
    confirmButton: {
        backgroundColor: colors.accent,
        borderRadius: 20,
        minWidth: 80,
        height: 30,
        justifyContent: 'center',
    },
    deleteButton: {
        marginRight: 5,
        padding: 5,
        width: 80,
        backgroundColor: colors.red,
        borderRadius: 20,
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: colors.button_text,
        alignSelf: "center",
        fontSize: 14,
        fontFamily: fonts.bold,
        textAlignVertical: 'center',
    },
    deleteButtonText: {
        color: colors.button_text,
        alignSelf: "center",
        fontSize: 14,
        fontFamily: fonts.bold,
    }
});

export default AddFriendsScreen;