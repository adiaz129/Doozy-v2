import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addFriend, deleteRequest, deletePendingRequest, deleteFriend, requestUser, fetchFriends, fetchRequests, fetchRequesting, fetchProfiles } from '../utils/friendFunctions'
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const AddFriendsScreen = ({ navigation }) => {

    const [friends, setFriends] = useState([]);
    const [reqFriends, setReqFriends] = useState([]); // received requests
    const [requesting, setRequesting] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [searchProfilesText, setSearchProfilesText] = useState("");
    const unsubscribeRef = useRef([]);
    const currentUser = FIREBASE_AUTH.currentUser;

    const filteredProfiles = profiles.filter((profile) => {
        return profile.name.toLowerCase().startsWith(searchProfilesText.toLowerCase())
            || profile.username.toLowerCase().startsWith(searchProfilesText.toLowerCase())
    });

    useEffect(() => {

        const unsubscribeFriends = fetchFriends(setFriends, currentUser.uid);
        const unsubscribeRequests = fetchRequests(setReqFriends);
        const unsubscribeRequesting = fetchRequesting(setRequesting);

        unsubscribeRef.current = [unsubscribeFriends, unsubscribeRequests, unsubscribeRequesting];

        return () => {
            unsubscribeRef.current.forEach(unsub => unsub());
        };

    }, []);

    useEffect(() => {

        const unsubscribeProfiles = fetchProfiles(friends, setProfiles);

        return () => unsubscribeProfiles();

    }, [friends, reqFriends, requesting]);

    const renderProfileCard = ({ item }) => {
        let status;
        const reqFriendsIds = reqFriends.map(data => data.id);
        if (reqFriendsIds.includes(item.id)) {
            status = "userReceivedRequest"; //requested
        }
        else if (requesting.some(obj => obj.id === item.id)) {
            status = "userSentRequest"; //requesting
        }
        else {
            status = "stranger";
        }
        return <ProfileCard item={item} status={status} />
    };


    const ProfileCard = ({ item, status }) => (
        <TouchableOpacity onPress={() => { navigation.navigate('Profile', { userID: item.id, status: status }) }} style={styles.profileCard}>
            <View style={styles.userInfo}>
                <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
                <View style={styles.profileCardNames}>
                    <Text style={styles.nameText}> {item.name} </Text>
                    <Text style={styles.usernameText}> {status === "userReceivedRequest" ? "wants to be friends" : item.username} </Text>
                </View>
            </View>
            {status === "userReceivedRequest" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => { deleteRequest(item) }}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={() => { addFriend(item) }}>
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
                )}
            {status === "userSentRequest" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity style={styles.requestedButton} onPress={() => { deletePendingRequest(item) }}>
                        <Text style={styles.confirmButtonText}>Requested</Text>
                    </TouchableOpacity>
                </View>
                )}
            {status === "stranger" &&
                (<View style={styles.requestConfirmationButtons}>
                    <TouchableOpacity onPress={() => { requestUser(item)}} style={{padding: 5}}>
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
                            renderItem={renderProfileCard}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled" />
                    </View>)}
                {searchProfilesText !== "" &&
                    (
                        <View style={styles.profileCardContainer}>
                            <FlatList
                                data={filteredProfiles}
                                renderItem={renderProfileCard}
                                keyExtractor={(item) => item.id} 
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