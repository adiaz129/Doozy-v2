import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFriends } from '../utils/friendFunctions'
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { deleteFriend } from '../utils/friendFunctions';


const FriendsScreen = ({ route, navigation }) => {
    const [friends, setFriends] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [isFriendMenuVisible, setFriendMenuVisible] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const { userID } = route.params;

    useEffect(() => {
        const unsubscribeFriends = fetchFriends(setFriends, userID);

        return () => unsubscribeFriends()

    }, []);


    const filteredFriends = friends.filter((friend) => {
        return friend.name.toLowerCase().startsWith(searchText.toLowerCase()) || friend.username.toLowerCase().startsWith(searchText.toLowerCase())
    });


    const ProfileCard = ({ item }) => (
        <TouchableOpacity onPress={() => { navigation.navigate('Profile', { userID: item.id, status: "unknown" }) }} style={styles.profileCard}>
            <View style={styles.userInfo}>
                <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
                <View style={styles.profileCardNames}>
                    <Text style={styles.nameText}> {item.name} </Text>
                    <Text style={styles.usernameText}> {item.username} </Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => {setFriendMenuVisible(true); setSelectedFriend(item)}} style={styles.menu}>
                <Ionicons name="ellipsis-vertical-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={isFriendMenuVisible}
                transparent={true}
                animationType="slide"
            >
                <TouchableWithoutFeedback onPress={() => {setFriendMenuVisible(false)}}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableOpacity onPress={() => {deleteFriend(selectedFriend); setFriendMenuVisible(false);}} style={styles.option}>
                        <Text style={{ color: colors.primary, ...styles.text }}>Remove Friend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {navigation.navigate('Profile', { userID: selectedFriend.id, status: "unknown" }); setFriendMenuVisible(false);}} style={styles.option}>
                        <Text style={{ color: colors.primary, ...styles.text }}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFriendMenuVisible(false)} style={styles.option}>
                        <Text style={{ color: colors.red, ...styles.text }}>Cancel</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
            <View style={styles.topContainer}>
                <TouchableOpacity onPress={navigation.goBack}>
                    <Ionicons name='chevron-back' size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.searchBrowseContainer}>
                <View style={styles.searchBoxContainer}>
                    <TextInput
                        placeholder='Search Friends...'
                        placeholderTextColor={'#C7C7CD'}
                        style={styles.searchBox}
                        onChangeText={setSearchText}
                    />
                </View>
                <View style={styles.profileCardContainer}>
                    <FlatList
                        data={filteredFriends}
                        renderItem={({ item }) => (<ProfileCard item={item} />)}
                        keyExtractor={(item) => item.id} 
                        keyboardShouldPersistTaps="handled" />
                </View>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4
    },
    option: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 18,
        fontFamily: fonts.regular,
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
        height: 40,
        flexDirection: "row",
        alignItems: "center",
        margin: 5

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
    menu: {
        padding: 10,
    },
});


export default FriendsScreen;



