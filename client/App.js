import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { FIREBASE_AUTH } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LandingScreen from './src/screens/Landing';
import RegisterScreen from './src/screens/Register';
import LoginScreen from './src/screens/Login';
import ProfileScreen from './src/screens/Profile';
import SettingsScreen from './src/screens/Settings';
import TimelineScreen from './src/screens/Timeline';
import TaskListScreen from './src/screens/TaskListScreen';
import FriendsScreen from './src/screens/Friends';
import AddFriendsScreen from './src/screens/AddFriends';
import EditProfileScreen from './src/screens/EditProfile';
import EditFieldScreen from './src/screens/EditField';
import PostScreen from './src/screens/Post';
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_400Regular_Italic } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import colors from './src/theme/colors';
import CheckedPostReceived from './src/assets/checked-post-received.svg'

const Tab = createBottomTabNavigator();
const LandingStack = createStackNavigator();
const TimelineStack = createStackNavigator();
const TaskListStack = createStackNavigator();
const ProfileStack = createStackNavigator();

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);


  const [fontsLoaded, fontError] = useFonts({
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_400Regular_Italic,
});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setLoggedIn(!!user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function setupChannel() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
    }
    setupChannel();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function TimelineStackScreen() {
    return (
      <TimelineStack.Navigator initialRouteName="Timeline" screenOptions={{ headerShown: false }}>
        <TimelineStack.Screen name="Timeline" component={TimelineScreen} />
        <TimelineStack.Screen name="Profile" component={ProfileScreen} />
        <TimelineStack.Screen name="Friends" component={FriendsScreen} />
        <TimelineStack.Screen name="AddFriends" component={AddFriendsScreen} />
        <TimelineStack.Screen name="Settings" component={SettingsScreen} />
        <TimelineStack.Screen name="EditProfile" component={EditProfileScreen} />
        <TimelineStack.Screen name="EditField" component={EditFieldScreen} />
        <TimelineStack.Screen name="Post" component={PostScreen} />
      </TimelineStack.Navigator>
    )
  }

  function ProfileStackScreen() {
    return (
      <ProfileStack.Navigator initialRouteName='Profile' screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="Profile" component={ProfileScreen} initialParams={{ userID: FIREBASE_AUTH.currentUser?.uid, status: 'currentUser' }} />
        <ProfileStack.Screen name="Friends" component={FriendsScreen} />
        <ProfileStack.Screen name="AddFriends" component={AddFriendsScreen} />
        <ProfileStack.Screen name="Settings" component={SettingsScreen} />
        <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
        <ProfileStack.Screen name="EditField" component={EditFieldScreen} />
        <ProfileStack.Screen name="Post" component={PostScreen} />
      </ProfileStack.Navigator>
    )
  }

  function TaskListStackScreen() {
    return (
      <TaskListStack.Navigator initialRouteName='TaskList' screenOptions={{ headerShown: false }}>
        <TaskListStack.Screen name="TaskList">
          {(props) => <TaskListScreen {...props} />}
        </TaskListStack.Screen>
      </TaskListStack.Navigator>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
            {loggedIn ? (
              <Tab.Navigator 
              initialRouteName='TaskListTab' 
              screenOptions={({ route }) => ({ headerShown: false, 
                tabBarStyle: {
                  paddingTop: 10,
                  backgroundColor: colors.surface,
                  height: 80,
                  position: 'absolute',
                  zIndex: 0,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                },
                tabBarActiveTintColor: colors.accent, 
                tabBarInactiveTintColor: colors.primary,
                tabBarShowLabel: false,
                tabBarIcon: ({ focused, color, size }) => {
                  if (route.name === 'TimelineTab') return <Entypo name='home' size={30} color={color} />;
                  else if (route.name === 'TaskListTab') return <FontAwesome6 name="list-check" size={30} color={color} />;
                  else if (route.name === 'ProfileTab') return <Ionicons name="person" size={30} color={color} />;
                },
              })
            }
              >
                <Tab.Screen name="TimelineTab" component={TimelineStackScreen} />
                <Tab.Screen name="TaskListTab" component={TaskListStackScreen} />
                <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
              </Tab.Navigator>
            ) : (
              <LandingStack.Navigator screenOptions={{ headerShown: false }}>
                <LandingStack.Screen name="Landing" component={LandingScreen} />
                <LandingStack.Screen name="Login" component={LoginScreen} />
                <LandingStack.Screen name="Register" component={RegisterScreen} />
              </LandingStack.Navigator>
            )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}