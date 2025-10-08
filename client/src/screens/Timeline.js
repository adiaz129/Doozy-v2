import React, { Component, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, ImageBackground, RefreshControl, Modal } from 'react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, where, query, orderBy } from "firebase/firestore";
import { SafeAreaView } from 'react-native-safe-area-context';
import fonts from '../theme/fonts';
import colors from '../theme/colors';
import CheckedPostReceived from "../assets/checked-post-received.svg";
import CheckedPost from '../assets/checked-post-sent.svg';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTimePassedString } from '../utils/timeFunctions'
import { sendLike } from '../utils/userReactionFunctions';
import CommentModal from '../components/timeline/CommentModal';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LikeModal from '../components/timeline/LikeModal';

const TimelineScreen = (props) => {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [currPostID, setCurrPostID] = useState(null);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [isLikeModalVisible, setLikeModalVisible] = useState(false);
  const [isLiking, setIsLiking] = useState(false);


  const currentUser = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    refreshPosts();
  }, []);


  const fetchFriends = async () => {

    try {
      const AllFriendsRef = collection(FIRESTORE_DB, 'Requests', currentUser.uid, 'AllFriends');
      const snapshot = await getDocs(AllFriendsRef);
      const friendsMap = {};
      snapshot.forEach((doc) => {
        friendsMap[doc.id] = doc.data();
      });
      return friendsMap;
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }

  const splitArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }


  const refreshPosts = async () => {

    if (!currentUser) return;

    try {

      const friendMap = await fetchFriends();

      const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
      const userSnapshot = await getDoc(userProfileRef);
      const userProfileData = userSnapshot.data();
      const likedPostsRef = collection(userProfileRef, 'LikedPosts');

      friendMap[currentUser.uid] = { name: userProfileData.name, profilePic: userProfileData.profilePic, username: userProfileData.username };

      const likedSnapshot = await getDocs(likedPostsRef);

      const likedPostIDs = likedSnapshot.docs.map(doc => doc.id);

      const friendIds = Object.keys(friendMap);
      const batches = splitArray(friendIds, 10);

      const postsRef = collection(FIRESTORE_DB, 'Posts');

      let tempPosts = [];
      for (const batch of batches) {
        const q = query(postsRef, where("userId", "in", batch), where("hidden", "==", false), orderBy("timePosted", "desc"));
        const snapshot = await getDocs(q);
        tempPosts = tempPosts.concat(snapshot.docs.map(doc => ({ id: doc.id, userID: doc.data().userId, liked: likedPostIDs.includes(doc.id), ...doc.data(), ...friendMap[doc.data().userId] })))
      }
      setPosts(tempPosts);

    } catch (error) {
      console.error("Error fetching posts: ", error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleLike = async (postID, didLike) => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      await sendLike(postID, didLike);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postID
            ? { ...post, liked: !didLike, likeCount: didLike ? post.likeCount - 1 : post.likeCount + 1 }
            : post
        )
      )
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLiking(false);
    }
  }

  const likeOnly = async (postID, didLike) => {
      if (!didLike) {
        toggleLike(postID, didLike);
      }
  }

  function doubleTapGesture(postID) {
    return Gesture.Tap().numberOfTaps(2).maxDuration(250).onEnd(() => {
      const post = posts.find(p => p.id === postID);
      if (post) {
        likeOnly(postID, post.liked);
      }
    }).runOnJS(true);
  }

  const toggleCommentModal = (postID) => {
    setCurrPostID(postID);
    setCommentModalVisible(!isCommentModalVisible);
  }

  const toggleLikeModal = (postID) => {
    setCurrPostID(postID);
    setLikeModalVisible(!isLikeModalVisible);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    refreshPosts().finally(() => {
      setRefreshing(false);
    });
  };

  const renderTask = ({ item }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={() => { props.navigation.navigate('Profile', { userID: item.userID, status: currentUser.uid === item.userID ? 'currentUser' : 'friend' }) }} style={styles.profileInfo}>
        <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
        <Text style={styles.username}>{item.username}</Text>
      </TouchableOpacity>
      {item.image && 
      <GestureDetector gesture={doubleTapGesture(item.id)}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </GestureDetector>}
      <View style={styles.taskInfo}>
        {item.image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => toggleLike(item.id, item.liked)}>
              {item.liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(item.id)}>
              <Text style={styles.count}>{item.likeCount}</Text>
            </TouchableOpacity> 
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => {toggleCommentModal(item.id)}} style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{item.commentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <View style={styles.postNameContainer}>
          <CheckedPostReceived width={32} height={32} />
          <Text style={styles.taskName}>{item.postName}</Text>
        </View>
        {item.description !== "" && <View style={styles.descriptionContainer}>
          <MaterialCommunityIcons name={"text"} size={16} color={colors.primary} />
          <Text style={styles.taskDescription}>{item.description}</Text>
        </View>}
        {!item.image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => toggleLike(item.id, item.liked)}>
              {item.liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(item.id)}>
              <Text style={styles.count}>{item.likeCount}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => {toggleCommentModal(item.id)}} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{item.commentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <Text style={styles.taskDate}>{getTimePassedString(item.timePosted)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={isCommentModalVisible}
        transparent={true}
        animationType='slide'
      >
        <TouchableWithoutFeedback onPress={() => toggleCommentModal(null)}>
          <View style={{ flex: 1 }}>
          </View>
        </TouchableWithoutFeedback>
        <CommentModal
          navigation={props.navigation}
          postID={currPostID}
          toggleCommentModal={toggleCommentModal}
          setPosts={setPosts}
        />
      </Modal>
      <Modal
        visible={isLikeModalVisible}
        transparent={true}
        animationType='slide'
      >
        <TouchableWithoutFeedback onPress={() => toggleLikeModal(null)}>
          <View style={{ flex: 1 }}>
          </View>
        </TouchableWithoutFeedback>
        <LikeModal
          navigation={props.navigation}
          postID={currPostID}
          toggleLikeModal={toggleLikeModal}
        />
      </Modal>
      <View style={styles.topBorder}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 1, paddingRight: 5, }}>
          <CheckedPost width={42} height={42} />
          <Text style={styles.title}>Doozy</Text>
        </View>
      </View>
      <FlatList
        data={posts}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={{marginBottom: 40}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBorder: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  postContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 40,
    marginRight: 10,
  },
  username: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  postImage: {
    width: '100%',
    height: 300,
    marginBottom: 10,
  },
  taskInfo: {
    paddingTop: 0,
    marginHorizontal: 5,
  },
  postNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    paddingLeft: 5,
    paddingBottom: 5,
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 5,
    paddingLeft: 10,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontFamily: fonts.regular,
    color: colors.primary,
    fontSize: 14,
    marginLeft: 5,
    minWidth: 20,
  },
  taskName: {
    marginLeft: 5,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 10,

  },
  taskDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary,
    paddingLeft: 10,
  },
  taskDate: {
    paddingLeft: 10,
    fontSize: 14,
    color: colors.fade,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
});


export default TimelineScreen;
