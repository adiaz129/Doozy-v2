import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Keyboard, Dimensions, FlatList, Animated, TextInput, Modal, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { deleteComment, fetchComments, sendComment } from '../../utils/userReactionFunctions';
import { getTimePassedString } from '../../utils/timeFunctions';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';


const CommentModal = (props) => {
    const { navigation, postID, toggleCommentModal, setPosts } = props;

    const currentUser = FIREBASE_AUTH.currentUser;
    const screenHeight = Dimensions.get('window').height;
    const modalHeight = screenHeight * 0.55;
    const maxHeight = screenHeight * 0.9;

    const [commentsHeight, setCommentsHeight] = useState(modalHeight - 130); //change
    const [commentText, setCommentText] = useState("");
    const [commentList, setCommentList] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [currCommentID, setCurrCommentID] = useState(null);
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

    const animatedHeight = useRef(new Animated.Value(modalHeight)).current;

    useEffect(() => {
        const willShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
            setCommentsHeight(maxHeight - e.endCoordinates.height - 110);
            Animated.timing(animatedHeight, {
                toValue: maxHeight,
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });

        const willHideSub = Keyboard.addListener('keyboardWillHide', (e) => {
            setCommentsHeight(modalHeight - 130);
            Animated.timing(animatedHeight, {
                toValue: modalHeight,
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });
        return () => {
            willShowSub.remove();
            willHideSub.remove();
        };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setCommentList(await fetchComments(postID));
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        })();
    }, [refresh])

    const postComment = async () => {
        await sendComment(postID, commentText);
        setRefresh(!refresh);
        if (setPosts) {
            setPosts(prevPosts =>
                prevPosts.map(post =>
                post.id === postID
                    ? { ...post, commentCount: post.commentCount + 1 }
                    : post
                )
            )
        }
        setCommentText("");
        Keyboard.dismiss();
    }

    const deleteCommentHelper = async () => {
        await deleteComment(postID, currCommentID);
        setRefresh(!refresh);
        setPosts(prevPosts =>
            prevPosts.map(post =>
            post.id === postID
                ? { ...post, commentCount: post.commentCount - 1 }
                : post
            )
        )
        setDeleteModalVisible(false);
    }

    const renderList = (item) => (
        <View style={styles.commentContainer}>
            <View style={styles.infoTrashContainer}>
                <View style={styles.userInfo}>
                    <TouchableOpacity onPress={() => { toggleCommentModal(); navigation.navigate('Profile', { userID: item.userID, status: 'unknown' }) }}>
                        <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
                    </TouchableOpacity>
                    <View style={styles.profileCardNames}>
                        <TouchableOpacity onPress={() => { toggleCommentModal(); navigation.navigate('Profile', { userID: item.userID, status: 'unknown' }) }}>
                            <Text style={styles.usernameText}>{item.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.commentText}>{item.comment}</Text>
                        <Text style={styles.timePostedText}>{getTimePassedString(item.timePosted)}</Text>
                    </View>
                </View>
                {item.userID === currentUser.uid && <TouchableOpacity onPress={() => {setCurrCommentID(item.id); setDeleteModalVisible(true)}}>
                    <Ionicons name="ellipsis-vertical-outline" size={24} color={colors.primary} />
                </TouchableOpacity>}
            </View>
        </View>
    );

    return (
        <Animated.View style={{ height: animatedHeight, backgroundColor: colors.surface, ...styles.container }}>
            <Modal
                visible={isDeleteModalVisible}
                transparent={true}
                animationType='slide'
                >
                <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
                    <View style={{ flex: 1 }}>
                    </View>
                </TouchableWithoutFeedback>
                <SafeAreaView style={styles.deleteModal}>
                    <TouchableOpacity onPress={deleteCommentHelper} style={styles.deleteModalButton}>
                        <Ionicons name="trash-outline" size={22} color={colors.red} />
                        <Text style={styles.deleteText}>Delete Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.deleteModalButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
            <View style={styles.topContainer}>
                <View style={styles.rowOneView}>
                    <TouchableOpacity onPress={() => toggleCommentModal(null)} style={{ width: 45 }}>
                        <Ionicons name="chevron-down-outline" size={32} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Comments</Text>
                    <View style={{ width: 45 }} />
                </View>
                <View style={{ height: commentsHeight, ...styles.flatList }}>
                    <FlatList
                        data={commentList}
                        renderItem={({ item, index }) => {
                            return (renderList(item));
                        }}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
                <View style={{ height: animatedHeight - modalHeight + 50, ...styles.commentInputContainer }}>
                    <TextInput
                        onChangeText={text => { setCommentText(text) }}
                        value={commentText}
                        placeholder="Enter comment..."
                        placeholderTextColor={'#C7C7CD'}
                        style={styles.commentInput}
                        multiline={true}
                        scrollEnabled={true}
                    />
                    {commentText.length > 0 && <TouchableOpacity onPress={() => { postComment() }}>
                        <Ionicons name={'arrow-up-circle'} size={32} color={colors.accent} />
                    </TouchableOpacity>}
                </View>
            </View>
        </Animated.View>
    );

}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'space-between',
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
    deleteModal: {
        height: 120,
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
    deleteModalButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
    },
    deleteText: {
        fontFamily: fonts.regular,
        fontSize: 18,
        color: colors.red,
        marginLeft: 10,
    },
    cancelText: {
        fontFamily: fonts.regular,
        fontSize: 18,
        color: colors.primary,
    },
    listSelectedContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '40%',
    },
    listText: {
        fontFamily: fonts.regular,
        color: colors.primary,
        fontSize: 14,
    },
    save: {
        fontSize: 18,
        color: colors.link,
        fontFamily: fonts.bold,
    },
    topContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    flatList: {
    },
    addListInputContainer: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    commentInput: {
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.primary,
        width: '90%',
        paddingTop: 5,
        paddingBottom: 5,
        maxHeight: 100,
    },
    saveListButton: {
        marginRight: 10,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: '#ccc',
        width: '95%',
        alignSelf: 'center',
        marginVertical: 5,
        paddingHorizontal: 10,
    },
    addListText: {
        fontSize: 18,
        marginLeft: 5,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    commentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        height: 60,
        marginVertical: 5,
    },
    infoTrashContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    profilePic: {
        marginRight: 10,
        height: 50,
        width: 50,
        borderRadius: 50,
    },
    usernameText: {
        fontFamily: fonts.bold,
        color: colors.primary,
        fontSize: 14,
    },
    commentText: {
        fontFamily: fonts.regular,
        color: colors.primary,
        fontSize: 16,
    },
    timePostedText: {
        fontFamily: fonts.regular,
        color: colors.fade,
        fontSize: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listName: {
        paddingLeft: 10,
        fontSize: 18,
        maxWidth: '90%',
        textAlign: 'center',
        alignSelf: 'center',
        height: 24,
        fontFamily: fonts.regular,
    },
    taskNumber: {

    },
});

export default CommentModal;