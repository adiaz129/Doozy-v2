import React, { Component, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, ImageBackground, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import fonts from '../theme/fonts';
import colors from '../theme/colors';
import CheckedPostReceived from "../assets/checked-post-received.svg";
import CheckedPost from '../assets/checked-post-sent.svg';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTimePassedString } from '../utils/timeFunctions'
import { toggleLike } from '../utils/userReactionFunctions';
import CommentModal from '../components/timeline/CommentModal';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LikeModal from '../components/timeline/LikeModal';
import axios from 'axios';

const TimelineScreen = (props) => {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [currPostID, setCurrPostID] = useState(null);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [isLikeModalVisible, setLikeModalVisible] = useState(false);

  useEffect(() => {
    refreshPosts();
  }, []);


  const refreshPosts = async () => {
    try {
      const response = await axios.get(`http://localhost:8800/api/posts`);
      const fetchedPosts = response.data.body;
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const likeOnly = async (postID, didLike) => {
      if (!didLike) {
        await toggleLike(postID, setPosts);
      }
  }

  function doubleTapGesture(postID) {
    return Gesture.Tap().numberOfTaps(2).maxDuration(250).onEnd(() => {
      const post = posts.find(p => p.post_id === postID);
      if (post) {
        likeOnly(postID, post.user_liked);
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
      <TouchableOpacity onPress={() => { props.navigation.navigate('Profile', { userID: item.user_id }) }} style={styles.profileInfo}>
        <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
        <Text style={styles.username}>{item.username}</Text>
      </TouchableOpacity>
      {item.image && 
      <GestureDetector gesture={doubleTapGesture(item.post_id)}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </GestureDetector>}
      <View style={styles.taskInfo}>
        {item.image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={async () => await toggleLike(item.post_id, setPosts)}>
              {item.user_liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(item.post_id)}>
              <Text style={styles.count}>{item.like_count}</Text>
            </TouchableOpacity> 
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => {toggleCommentModal(item.post_id)}} style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{item.comment_count}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <View style={styles.postNameContainer}>
          <CheckedPostReceived width={32} height={32} />
          <Text style={styles.taskName}>{item.post_name}</Text>
        </View>
        {item.description !== "" && <View style={styles.descriptionContainer}>
          <MaterialCommunityIcons name={"text"} size={16} color={colors.primary} />
          <Text style={styles.taskDescription}>{item.description}</Text>
        </View>}
        {!item.image && <View style={styles.reactionContainer}>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={async () => await toggleLike(item.post_id, setPosts)}>
              {item.user_liked ? (<FontAwesome name='heart' size={24} color={colors.red} />)
                :
                (<FontAwesome name='heart-o' size={24} color={colors.primary} />)}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLikeModal(item.post_id)}>
              <Text style={styles.count}>{item.like_count}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reaction}>
            <TouchableOpacity onPress={() => {toggleCommentModal(item.post_id)}} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <Ionicons name='chatbubble-outline' size={26} color={colors.primary} />
              <Text style={styles.count}>{item.comment_count}</Text>
            </TouchableOpacity>
          </View>
        </View>}
        <Text style={styles.taskDate}>{getTimePassedString(item.time_posted)}</Text>
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
        extraData={posts}
        renderItem={renderTask}
        keyExtractor={(item) => item.post_id}
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
