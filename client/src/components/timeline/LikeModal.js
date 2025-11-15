import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Keyboard, Dimensions, FlatList, Animated, TextInput, Modal, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../firebaseConfig';
import { getTimePassedString } from '../../utils/timeFunctions';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLikes } from '../../utils/userReactionFunctions';
const LikeModal = (props) => {

    const {navigation, postID, toggleLikeModal} = props;

    const screenHeight = Dimensions.get('window').height;
    const modalHeight = screenHeight * 0.55;

    const [likeList, setLikeList] = useState([]);

     useEffect(() => {
            (async () => {
                try {
                    setLikeList(await fetchLikes(postID));
                } catch (error) {
                    console.error("Error fetching likes:", error);
                }
            })();
        }, [])

    const ProfileCard = ({ item }) => (
            <TouchableOpacity onPress={() => { toggleLikeModal(null); navigation.navigate('Profile', { userID: item.user_id, status: "unknown" }) }} style={styles.profileCard}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
                    <View style={styles.profileCardNames}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.usernameText}>{item.username}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );

    return (<View style={[{height: modalHeight}, styles.container]}>
                <View style={styles.rowOneView}>
                    <TouchableOpacity onPress={() => toggleLikeModal(null)} style={{ width: 45 }}>
                        <Ionicons name="chevron-down-outline" size={32} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Likes</Text>
                    <View style={{ width: 45 }} />
                </View>
                <View style={{ height: modalHeight, ...styles.flatList }}>
                    <FlatList
                        data={likeList}
                        renderItem={({ item }) => {
                            return <ProfileCard item={item} />
                        }}
                        keyExtractor={item => item.user_id}
                        showsVerticalScrollIndicator={true}
                    />
                </View>
            </View>)
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    rowOneView: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15
    },
    title: {
        fontFamily: fonts.regular,
        color: colors.primary,
        fontSize: 18,
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
});

export default LikeModal;