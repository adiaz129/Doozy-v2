import { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckedPostReceived from "../assets/checked-post-received.svg";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import fonts from "../theme/fonts";
import colors from "../theme/colors";
import { getTimePassedString } from '../utils/timeFunctions'
import { toggleLike } from "../utils/userReactionFunctions";
import CommentModal from "../components/timeline/CommentModal";
import { AuthContext } from "../AuthContext.js";
import LikeModal from "../components/timeline/LikeModal";
import axios from "axios";

const PostScreen = ({ route, navigation }) => {
  const { post, user } = route.params;

  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [tempPost, setTempPost] = useState([post]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLikeModalVisible, setLikeModalVisible] = useState(false);
  const { auth } = useContext(AuthContext);


  const toggleCommentModal = () => {
    setCommentModalVisible(!isCommentModalVisible);
  }
  const toggleLikeModal = () => {
    setLikeModalVisible(!isLikeModalVisible);
  }

  const likeOnly = async (postID) => {
    if (!tempPost[0].user_liked) {
      await toggleLike(postID, setTempPost);
    }
  }

  function doubleTapGesture(postID) {
    return Gesture.Tap().numberOfTaps(2).maxDuration(250).onEnd(() => {
      likeOnly(postID);
    }).runOnJS(true);
  }

  const deleteItem = async () => {
    
    try {
      console.log(post.post_id)
      const response = await axios.delete(`http://localhost:8800/api/posts/${post.post_id}`);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
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
          postID={tempPost[0].post_id}
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
          postID={tempPost[0].post_id}
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
        {auth.uid === user.user_id && <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
          <Ionicons name="ellipsis-vertical-outline" size={24} color={colors.primary} />
        </TouchableOpacity>}
      </View>
      {tempPost[0].image &&
        <GestureDetector gesture={doubleTapGesture(tempPost[0].post_id)}>
          <Image source={{ uri: tempPost[0].image }} style={styles.postImage} />
        </GestureDetector>}
      <View style={styles.taskInfo}>
        {tempPost[0].image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={async () => await toggleLike(tempPost[0].post_id)}>
              {tempPost[0].user_liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(post.post_id)}>
              <Text style={styles.count}>{tempPost[0].like_count}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => { toggleCommentModal() }} style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{tempPost[0].comment_count}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <View style={styles.postNameContainer}>
          <CheckedPostReceived width={32} height={32} />
          <Text style={styles.taskName}>{tempPost[0].post_name}</Text>
        </View>
        {tempPost[0].description !== "" && <View style={styles.descriptionContainer}>
          <MaterialCommunityIcons name={"text"} size={16} color={colors.primary} />
          <Text style={styles.taskDescription}>{tempPost[0].description}</Text>
        </View>}
        {!tempPost[0].image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={async () => await toggleLike(tempPost[0].post_id, setTempPost)}>
              {tempPost[0].user_liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(post.post_id, setTempPost)}>
              <Text style={styles.count}>{tempPost[0].like_count}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => { toggleCommentModal() }}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.count}>{tempPost[0].comment_count}</Text>
          </View>
        </View>}
        <Text style={styles.taskDate}>{getTimePassedString(tempPost[0].time_posted)}</Text>
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