import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckedPostReceived from "../assets/checked-post-received.svg";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import fonts from "../theme/fonts";
import colors from "../theme/colors";
import { getTimePassedString } from '../utils/timeFunctions'
import { sendLike } from "../utils/userReactionFunctions";
import CommentModal from "../components/timeline/CommentModal";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../firebaseConfig";
import { doc, getDoc, getDocs, collection, writeBatch, increment, arrayRemove } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import LikeModal from "../components/timeline/LikeModal";

//CHAGE EVERYTING
const PostScreen = ({ route, navigation }) => {
  const { post, user } = route.params;

  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [tempPost, setTempPost] = useState([post]);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLikeModalVisible, setLikeModalVisible] = useState(false);
  const currentUser = FIREBASE_AUTH.currentUser;

  const toggleCommentModal = () => {
    setCommentModalVisible(!isCommentModalVisible);
  }
  const toggleLikeModal = () => {
    setLikeModalVisible(!isLikeModalVisible);
  }

  const toggleLike = async (postID) => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      await sendLike(postID, liked);
      setTempPost(prevPosts =>
        prevPosts.map(post =>
          true
            ? { ...post, likeCount: liked ? post.likeCount - 1 : post.likeCount + 1 }
            : post
        )
      )
      setLiked(!liked);
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLiking(false);
    }
  }

  const likeOnly = async (postID) => {
    if (!liked) {
      toggleLike(postID);
    }
  }

  function doubleTapGesture(postID) {
    return Gesture.Tap().numberOfTaps(2).maxDuration(250).onEnd(() => {
      likeOnly(postID, liked);
    }).runOnJS(true);
  }

  const setLikeStatus = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    const currUserLikeRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'LikedPosts', post.id)
    const likedSnapshot = await getDoc(currUserLikeRef);
    setLiked(likedSnapshot.exists());
  }

  useEffect(() => {
    setLikeStatus();
  }, [])

  const deleteItem = async () => {
    const docId = post.id;
    const image = post.image;
    const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
    const listsRef = collection(userProfileRef, 'Lists');
    try {
      const batch = writeBatch(FIRESTORE_DB);
      let listRef;
      const postRef = doc(FIRESTORE_DB, 'Posts', post.id);
      const likesRef = collection(postRef, 'Likes');
      const commentsRef = collection(postRef, 'Comments');
      post.listIds.forEach((listId) => {
        listRef = doc(listsRef, listId);
        batch.update(listRef, { postIds: arrayRemove(docId) })
      });
      const likesSnap = await getDocs(likesRef);
      likesSnap.forEach(likeDoc => {
        const userLikeRef = doc(FIRESTORE_DB, 'Users', likeDoc.id, 'LikedPosts', docId);
        batch.delete(userLikeRef);
        batch.delete(likeDoc.ref);
      });

      const commentsSnap = await getDocs(commentsRef);
      commentsSnap.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      batch.delete(postRef);
      if (image) {
        const imageRef = ref(getStorage(), image);
        await deleteObject(imageRef);
      }
      batch.update(userProfileRef, { posts: increment(-1) });
      setDeleteModalVisible(false);
      navigation.goBack();
      await batch.commit();
    } catch (error) {
      console.error('Error deleting document: ', error);
    };

  }

  return (
    <SafeAreaView style={styles.postContainer}>
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
          <TouchableOpacity onPress={deleteItem} style={styles.deleteModalButton}>
            <Ionicons name="trash-outline" size={22} color={colors.red} />
            <Text style={styles.deleteText}>Delete Post</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.deleteModalButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
          navigation={navigation}
          postID={tempPost[0].id}
          toggleCommentModal={toggleCommentModal}
          setPosts={setTempPost}
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
          navigation={navigation}
          postID={post.id}
          toggleLikeModal={toggleLikeModal}
        />
      </Modal>
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons name='chevron-back' size={24} color='black' />
        </TouchableOpacity>
      </View>
      <View style={styles.profileBar}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
          <Text style={styles.username}>{user.username}</Text>
        </View>
        {currentUser.uid === user.id && <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
          <Ionicons name="ellipsis-vertical-outline" size={24} color={colors.primary} />
        </TouchableOpacity>}
      </View>
      {tempPost[0].image &&
        <GestureDetector gesture={doubleTapGesture(tempPost[0].id)}>
          <Image source={{ uri: tempPost[0].image }} style={styles.postImage} />
        </GestureDetector>}
      <View style={styles.taskInfo}>
        {tempPost[0].image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => toggleLike(tempPost[0].id)}>
              {liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(post.id)}>
              <Text style={styles.count}>{tempPost[0].likeCount}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => { toggleCommentModal() }} style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{tempPost[0].commentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <View style={styles.postNameContainer}>
          <CheckedPostReceived width={32} height={32} />
          <Text style={styles.taskName}>{tempPost[0].postName}</Text>
        </View>
        {tempPost[0].description !== "" && <View style={styles.descriptionContainer}>
          <MaterialCommunityIcons name={"text"} size={16} color={colors.primary} />
          <Text style={styles.taskDescription}>{tempPost[0].description}</Text>
        </View>}
        {!tempPost[0].image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => toggleLike(tempPost[0].id)}>
              {liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(post.id)}>
              <Text style={styles.count}>{tempPost[0].likeCount}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => { toggleCommentModal() }}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.count}>{tempPost[0].commentCount}</Text>
          </View>
        </View>}
        <Text style={styles.taskDate}>{getTimePassedString(tempPost[0].timePosted)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  postContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topContainer: {
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    marginHorizontal: 5,
  },
  postNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    paddingBottom: 5
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

export default PostScreen;