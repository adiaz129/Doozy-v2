import React, { useState, useEffect, useRef } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigationState } from '@react-navigation/native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { addFriend, deleteRequest, deletePendingRequest, deleteFriend, requestUser, findStatus } from '../utils/friendFunctions';
import CheckedPost from '../assets/checked-post-sent.svg';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const ProfileScreen = ({ route, navigation }) => {
  const { userID, status } = route.params;
  const routes = useNavigationState(state => state.routes)
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const windowWidth = Dimensions.get('window').width;
  const unsubscribeRef = useRef();

  function fetchProfile() {
    let unsubscribeProfile = () => { };

    try {
      const userProfileRef = doc(FIRESTORE_DB, 'Users', userID);

      unsubscribeProfile = onSnapshot(userProfileRef, (userSnap) => {
        if (userSnap.exists()) {
          setUserProfile({ id: userSnap.id, ...userSnap.data() });
        }
        else {
          setUserProfile(null);
        }
      })
      return unsubscribeProfile;

    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  }

  function fetchPosts() {
    let unsubscribePosts = () => { };

    try {
      const postsRef = collection(FIRESTORE_DB, 'Posts');

      const q = query(postsRef, where("userId", "==", userID), where("hidden", "==", false), orderBy("timePosted", "desc"));
      unsubscribePosts = onSnapshot(q, (querySnapshot) => {
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);
      })
      return unsubscribePosts;

    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  useEffect(() => {
    let unsubscribeProfile;
    let unsubscribePosts;
    (async () => {
      let tempFriendStatus;
      if (status === "unknown") {
        tempFriendStatus = await findStatus(userID);
        setFriendStatus(tempFriendStatus);
      }
      else {
        setFriendStatus(status);
        tempFriendStatus = status;
      }
      unsubscribeProfile = fetchProfile();

      if (tempFriendStatus == "currentUser" || tempFriendStatus == "friend") {
        unsubscribePosts = fetchPosts();
      }

    })();
    unsubscribeRef.current = [unsubscribeProfile, unsubscribePosts].filter(Boolean);
    return () => {
      unsubscribeRef.current.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [friendStatus])

  const goToSettingsScreen = () => {
    navigation.navigate('Settings');
  };

  const goToFriendsScreen = () => {
    navigation.navigate('Friends', { userID: userID });
  };

  const goToAddFriendsScreen = () => {
    navigation.navigate('AddFriends');
  };

  const handleStatusChange = () => {
    if (friendStatus == "currentUser") {
      navigation.navigate("EditProfile", { user: userProfile });
    }
    else if (friendStatus == "friend") {
      deleteFriend(userProfile);
      setFriendStatus("stranger");
    }
    else if (friendStatus == "stranger") {
      requestUser(userProfile);
      setFriendStatus("userSentRequest") // i should check if there was an error
    }
    else {
      deletePendingRequest(userProfile);
      setFriendStatus("stranger")
    }
  }

  const handlePostPress = (index) => {
    navigation.navigate("Post", { post: posts[index], user: userProfile })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.usernameContainer}>
          {routes.length > 1 && (
            <TouchableOpacity onPress={navigation.goBack} style={{ paddingRight: 10 }}>
              <Ionicons name='chevron-back' size={24} color={colors.primary} />
            </TouchableOpacity>)}
          <Text style={styles.usernameText}>{userProfile ? userProfile.username : ""}</Text>
        </View>
        {friendStatus == "currentUser" && (<View style={styles.topContainerButtons}>
          <TouchableOpacity onPress={goToAddFriendsScreen} style={styles.friendsButton}>
            <Ionicons name="person-add-outline" size={30} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToSettingsScreen} style={styles.settingsButton}>
            <Ionicons name="settings-sharp" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>)}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {userProfile ? (
          <View style={styles.profileContainer}>
            {friendStatus == "userReceivedRequest" && (<View style={styles.friendRequest}>
              <Text style={styles.detailText}>{userProfile.username} wants to be friends</Text>
              <View style={{ flexDirection: 'row', width: '60%' }}>
                <TouchableOpacity style={styles.deleteButton} onPress={() => { deleteRequest(userProfile); setFriendStatus("stranger") }}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={() => { addFriend(userProfile); setFriendStatus("friend") }}>
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>)}
            <View style={styles.upperProfileContainer}>
              <Image source={{ uri: userProfile.profilePic }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              <View style={[styles.dataButtonContainer, { width: windowWidth - 100 - 30 }]}>
                <View style={styles.dataContainer}>
                  <TouchableOpacity onPress={goToFriendsScreen} style={styles.data}>
                    <Text style={styles.dataStat}>{userProfile.friends}</Text>
                    <Text style={styles.dataText}>Friends</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <View style={styles.data}>
                    <Text style={styles.dataStat}>{userProfile.posts}</Text>
                    <Text style={styles.dataText}>Posts</Text>
                  </View>
                </View>
                {friendStatus !== "userReceivedRequest" ?
                  (<TouchableOpacity style={styles.statusButton} onPress={handleStatusChange}>
                    <Text style={styles.buttonText}>{friendStatus == "currentUser" ? "Edit Profile" :
                      (friendStatus == "friend" ? "Friends" :
                        (friendStatus == "userSentRequest" ? "Cancel Request" :
                          "Add Friend"
                        ))}</Text>
                  </TouchableOpacity>) :
                  (<View style={{ height: 20 }} />)}
              </View>

            </View>
            <View style={styles.lowerProfileContainer}>
              <Text style={styles.name}>{userProfile.name}</Text>
              <Text style={styles.bio}>{userProfile.bio}</Text>
            </View>
          </View>
        ) :
          <View style={styles.profileContainer}>
            <View style={styles.upperProfileContainer}>
              <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/doozy-3d54c.appspot.com/o/profilePics%2Fdefault.jpg?alt=media&token=c4b20aae-830c-4d47-aa90-2a3ebd6e16fb" }}
                style={{ width: 100, height: 100, borderRadius: 50 }} />
              <View style={[styles.dataButtonContainer, { width: windowWidth - 100 - 30 }]}>
                <View style={styles.dataContainer}>
                  <TouchableOpacity onPress={goToFriendsScreen} style={styles.data}>
                    <Text style={styles.dataStat}>-</Text>
                    <Text style={styles.dataText}>Friends</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <View style={styles.data}>
                    <Text style={styles.dataStat}>-</Text>
                    <Text style={styles.dataText}>Posts</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </View>

            </View>
          </View>
        }
        {userProfile ? (
          (friendStatus === "currentUser" || friendStatus === "friend") ? (
            <View style={styles.tasksContainer}>
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <TouchableOpacity
                    key={post.id}
                    onPress={() => handlePostPress(index)}
                    style={[
                      styles.item,
                      index === 0 && styles.firstTask,
                      index === posts.length - 1 && styles.lastTask
                    ]}
                  >
                    <View style={styles.postContainer}>
                      <View style={styles.postInfoContainer}>
                        <View style={styles.postNameContainer}>
                          <CheckedPost width={32} height={32} />
                          <Text style={styles.postName}>{post.postName}</Text>
                        </View>
                      </View>
                      {post.image && (
                        <Image source={{ uri: post.image }} style={styles.photo} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.privateView}>
                  <Ionicons name="sad-outline" size={48} color={colors.primary} />
                  <Text style={styles.privateText}>No posts yet</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.privateView}>
              <Feather name="lock" size={48} color={colors.primary} />
              <Text style={styles.privateText}>This account is private</Text>
              <Text style={styles.privateDescription}>Add as friend to see their posts</Text>
            </View>
          )
        ) : (
          <View>
            <View style={styles.privateView}>
              <MaterialIcons name="person-off" size={48} color={colors.primary} />
              <Text style={styles.privateText}>This account no longer exists</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  topContainerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  settingsButton: {
    padding: 5
  },
  friendsButton: {
    padding: 5
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  profileContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    margin: 10
  },
  upperProfileContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'left',
    borderRadius: 10,
    marginLeft: 20

  },
  dataButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    marginLeft: 10,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

  },
  data: {
    alignItems: 'left',
    paddingHorizontal: '40',
  },
  dataStat: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 16,
  },
  dataText: {
    color: colors.primary,
    fontFamily: fonts.regular,
    fontSize: 16,
    width: 60,
  },
  divider: {
    width: 1,
    height: '90%',
    borderRadius: 2,
    backgroundColor: colors.primary
  },
  friendRequest: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: fonts.regular,
    color: colors.fade,
    fontSize: 14,
    paddingBottom: 3,
    width: '35%',

  },
  friendRequestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: colors.red,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    width: '45%',
  },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    width: '45%',
  },
  buttonText: {
    padding: 5,
    color: colors.button_text,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  statusButton: {
    alignSelf: 'center',
    width: '90%',
    backgroundColor: colors.accent,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowerProfileContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  name: {
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  bio: {
    fontFamily: fonts.regular,
    color: colors.fade,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },

  postDescription: {
    width: '65%',
    alignItems: 'center',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 15,
  },
  tasksContainer: {
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 10,
  },
  firstTask: {
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },
  lastTask: {
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
  },
  postContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  postInfoContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  postNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  unopenedPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postName: {
    paddingLeft: 10,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  postDescription: {
    lineHeight: 32,
    height: 32,
  },
  postDate: {
    lineHeight: 32,
    height: 32,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: '20%',
  },
  privateView: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  privateText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 18,
    paddingTop: 15,
  },
  privateDescription: {
    fontFamily: fonts.regular,
    color: colors.primary,
    fontSize: 16,
    paddingTop: 5,
  },
});

export default ProfileScreen;
