import React, { createContext, useContext, useState, useRef, forwardRef, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TextInput, Text, View, TouchableOpacity, TouchableWithoutFeedback, Modal, Platform, DynamicColorIOS } from 'react-native';
import Task from '../components/task-page/Task';
import TaskCreation from '../components/task-page/TaskCreation';
import EditTask from '../components/task-page/EditTask';
import ViewCompletedTask from '../components/task-page/ViewCompletedTask';
import ListSelect from '../components/task-page/ListSelect';
import CameraOptionMenu from '../components/task-page/PopUpMenus/CameraOptionMenu';
import ConfirmationModal from '../components/ConfirmationModal';
import { doc, collection, getDoc, addDoc, getDocs, deleteDoc, updateDoc, runTransaction, writeBatch, increment, query, where, onSnapshot, arrayRemove, arrayUnion, orderBy } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB, uploadToFirebase } from '../../firebaseConfig';
import { getStorage, ref, deleteObject } from "firebase/storage";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer } from 'react-native-drawer-layout';
import { Ionicons, MaterialCommunityIcons, FontAwesome6, FontAwesome } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Notifications from "expo-notifications";
import { addImage, takePhoto } from '../utils/photoFunctions';
import CheckedPost from '../assets/checked-post-sent.svg';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { getDueDateString } from '../utils/timeFunctions';
import { AuthContext } from '../AuthContext';


const TaskListScreen = (props) => {

    const { navigation } = props;
    const { logout } = useContext(AuthContext); //remove
    const [order, setOrder] = useState("default");
    const [listId, setListId] = useState("0");
    const [taskItems, setTaskItems] = useState([]);
    const [completedTaskItems, setCompletedTaskItems] = useState([]);
    const [listItems, setListItems] = useState([]);
    const [isEditTaskVisible, setEditTaskVisible] = useState(false);
    const [editIndex, setEditIndex] = useState();
    const [isCompletedTaskVisible, setCompletedTaskVisible] = useState(false);
    const [isUncompleteTaskConfirmationVisible, setUncompleteTaskConfirmationVisible] = useState(false);
    const [completedTaskIndex, setCompletedTaskIndex] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [userProfile, setUserProfile] = useState();
    const [sortYPosition, setSortYPosition] = useState();
    const [cameraOptionModalVisible, setCameraOptionModalVisible] = useState(false);
    const [resolver, setResolver] = useState(null);
    const [currList, setCurrList] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const unsubscribeRef = useRef();
    const sortRef = useRef(null);
    const currentUser = FIREBASE_AUTH.currentUser;

    const [selectedLists, setSelectedLists] = useState([]);


    // useEffect(() => {
    //     const unsubscribeTasks = fetchTasks();
    //     const unsubscribePosts = fetchPosts();
    //     const unsubscribeLists = fetchLists();
    //     const unsubscribeUserProfile = fetchUserProfile();

    //     unsubscribeRef.current = [unsubscribeTasks, unsubscribePosts, unsubscribeLists, unsubscribeUserProfile];
    //     return () => {
    //         unsubscribeRef.current.forEach(unsub => unsub());
    //     };
    // }, [listId, refreshing]);

    useEffect(() => {
        //sortTasks(taskItems);
    }, [order, taskItems]);

    function fetchTasks() {
        let unsubscribeTasks = () => { };
        let unsubscribeList = () => { };
        let taskIds = [];

        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const tasksRef = collection(userProfileRef, 'Tasks');
        const listRef = doc(userProfileRef, 'Lists', listId);

        try {
            unsubscribeList = onSnapshot(listRef, (listSnap) => {
                taskIds = listSnap.exists() ? listSnap.data().taskIds : [];
                unsubscribeTasks = onSnapshot(tasksRef, (querySnapshotTasks) => {
                    const fetchedTasks = [];
                    querySnapshotTasks.forEach((doc) => {
                        let docData = doc.data();
                        if (!listSnap.exists() || taskIds.includes(doc.id)) {
                            if (docData.completeByDate?.timestamp) {
                                const millisCompleteBy = docData.completeByDate.timestamp.seconds * 1000 + Math.floor(docData.completeByDate.timestamp.nanoseconds / 1e6);
                                docData.completeByDate = {
                                    ...docData.completeByDate,
                                    timestamp: new Date(millisCompleteBy)
                                }
                            }
                            if (docData.repeatEnds) {
                                const millisRepeatEnds = docData.repeatEnds.seconds * 1000 + Math.floor(docData.repeatEnds.nanoseconds / 1e6);
                                docData.repeatEnds = new Date(millisRepeatEnds);
                            }
                            fetchedTasks.push({ id: doc.id, ...docData });
                        }
                    });
                    sortTasks(fetchedTasks);
                })
            })
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }

        return () => { unsubscribeTasks(); unsubscribeList; };
    }

    const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

    function fetchPosts() {
        let unsubscribeList = () => { };
        let unsubscribePosts = () => { };
        let postIds = [];

        const postsRef = collection(FIRESTORE_DB, 'Posts');
        const q = query(postsRef, where("userId", "==", currentUser.uid), orderBy('timePosted', 'desc'));
        const listRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'Lists', listId);

        try {
            unsubscribeList = onSnapshot(listRef, (listSnap) => {
                postIds = listSnap.exists() ? listSnap.data().postIds : [];
                unsubscribePosts = onSnapshot(q, (querySnapshotPosts) => {
                    const fetchedPosts = [];
                    querySnapshotPosts.forEach((doc) => {
                        let docData = doc.data();
                        if (!listSnap.exists() || postIds.includes(doc.id)) {
                            if (docData.completeByDate?.timestamp) {
                                const millisCompleteBy = docData.completeByDate.timestamp.seconds * 1000 + Math.floor(docData.completeByDate.timestamp.nanoseconds / 1e6);
                                docData.completeByDate = {
                                    ...docData.completeByDate,
                                    timestamp: new Date(millisCompleteBy)
                                }
                            }
                            if (docData.repeatEnds) {
                                const millisRepeatEnds = docData.repeatEnds.seconds * 1000 + Math.floor(docData.repeatEnds.nanoseconds / 1e6);
                                docData.repeatEnds = new Date(millisRepeatEnds);
                            }
                            fetchedPosts.push({ id: doc.id, ...docData });
                        }
                    });
                    setCompletedTaskItems(fetchedPosts);
                })
            })
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
        return () => { unsubscribePosts(); unsubscribeList(); }

    }


    function fetchLists() {
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const listsRef = collection(userProfileRef, 'Lists');
        queryListsRef = query(listsRef, orderBy('timeListCreated', 'desc'));
        try {
            const unsubscribeLists = onSnapshot(queryListsRef,
                (querySnapshotLists) => {
                    const fetchedLists = [];
                    querySnapshotLists.forEach((doc) => {
                        fetchedLists.push({ id: doc.id, ...doc.data() });
                    });
                    setListItems(fetchedLists);
                    const foundList = fetchedLists.find((fetchedList) => fetchedList.id === listId);
                    if (listId === "0") {
                        setCurrList("Master List");
                        setSelectedLists([]);
                    }
                    else if (foundList){
                        setCurrList(foundList.name);
                        setSelectedLists([foundList.id]);
                    }
                    else {
                        setCurrList("Master List");
                    }
                });
            return unsubscribeLists;
        } catch (error) {
            console.error("Error fetching lists:", error);
        }
    }

    function fetchUserProfile() {
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        try {
            const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                }
            })
            return unsubscribeUserProfile;
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    }

    const arraysAreEqual = (arr1, arr2) => {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].id !== arr2[i].id) return false;
        }
        return true;
    }

    const sortTasks = (fetchedTasks) => {
        let sortedFetchedTasks = [];
        if (order == "default") { //completeByDate -> priority -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (!a.completeByDate && b.completeByDate) {
                    return 1
                }
                else if (a.completeByDate && !b.completeByDate) {
                    return -1
                }
                else if ((!a.completeByDate && !b.completeByDate) || (a.completeByDate && b.completeByDate && a.completeByDate.timestamp === b.completeByDate.timestamp)) {
                    if (a.priority - b.priority !== 0) {
                        return b.priority - a.priority;
                    }
                    else {
                        return b.timeTaskCreated - a.timeTaskCreated;
                    }
                }
                else {
                    return a.completeByDate.timestamp - b.completeByDate.timestamp;
                }
            })
        }
        else if (order == "priority") { //priority -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (a.priority - b.priority !== 0) {
                    return b.priority - a.priority;
                }
                else {
                    return b.timeTaskCreated - a.timeTaskCreated;
                }
            })
        }
        else if (order == "dueDate") { // completeByDate -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (!a.completeByDate && b.completeByDate) {
                    return 1
                }
                else if (a.completeByDate && !b.completeByDate) {
                    return -1
                }
                else if ((!a.completeByDate && !b.completeByDate) || (a.completeByDate && b.completeByDate && a.completeByDate.timestamp === b.completeByDate.timestamp)) {
                    return b.timeTaskCreated - a.timeTaskCreated;
                }
                else {
                    return a.completeByDate.timestamp - b.completeByDate.timestamp;
                }
            })
        }
        else { // name
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                return a.taskName.localeCompare(b.taskName);
            })
        }
        if (arraysAreEqual(sortedFetchedTasks, taskItems)) {
            return;
        }
        setTaskItems(sortedFetchedTasks);
    }

    const completeTask = async (index, complete) => { // clean this
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const tasksRef = collection(userProfileRef, 'Tasks');
        const postsRef = collection(FIRESTORE_DB, 'Posts');
        const listsRef = collection(userProfileRef, 'Lists');
        if (!complete) { // task --> post
            const task = taskItems[index];
            try {
                const batch = writeBatch(FIRESTORE_DB);
                const docId = task.id;
                const listIds = task.listIds;
                const postRef = doc(postsRef);
                batch.set(postRef, { // store post
                    userId: currentUser.uid,
                    postName: task.taskName,
                    description: task.description,
                    timePosted: new Date(),
                    priority: task.priority,
                    reminders: task.reminders,
                    completeByDate: task.completeByDate,
                    isCompletionTime: task.isCompletionTime,
                    listIds: task.listIds,
                    timeTaskCreated: task.timeTaskCreated,
                    image: null,
                    hidden: false,
                    likeCount: 0,
                    commentCount: 0,
                })

                let listRef;
                listIds.forEach((listId) => { // add post to same lists
                    listRef = doc(listsRef, listId);
                    batch.update(listRef, { postIds: arrayUnion(postRef.id) });
                })

                batch.update(userProfileRef, { posts: increment(1) }); // increment post count

                let imageURI;
                if (Platform.OS === 'android') { //TEMPORARY FIX
                    imageURI = await addImage();
                }
                else {
                    while (true) {
                        const cameraOption = await openCameraOptionMenu();
                        if (cameraOption == 'cancel') {
                            setCameraOptionModalVisible(false);
                            return;
                        }
                        else if (cameraOption == 'library') {
                            imageURI = await addImage();
                            if (imageURI) {
                                break;
                            }
                        }
                        else if (cameraOption == 'camera') {
                            imageURI = await takePhoto();
                            if (imageURI) {
                                break;
                            }
                        }
                        else if (cameraOption == 'no post') {
                            imageURI = null;
                            batch.update(postRef, { hidden: true });
                            break;
                        }
                        else {
                            imageURI = null;
                            break;
                        }
                    }
                    setCameraOptionModalVisible(false);
                }
                await cancelNotifications(task.notificationIds); // cancel any upcoming notifications

                const taskRef = doc(tasksRef, task.id);
                let newCompleteByDate;
                if (task.completeByDate && (newCompleteByDate = isRepeatingTask(task.completeByDate.timestamp, task.repeatEnds, task.repeat))) {// check if task repeats and return next possible date
                    batch.update(taskRef, { completeByDate: newCompleteByDate }); // set new completebydate, add one to post child counter, should be on its youngest child meaning no child has been uncompleted
                    if (task.reminders.length !== 0) { // schedule notifications
                        if (await configureNotifications()) {
                            const tempNotifIds = await scheduleNotifications(task.reminders, newCompleteByDate, task.isCompletionTime, task.taskName);
                            batch.update(taskRef, { notificationIds: tempNotifIds });
                        }
                    }
                }
                else { // if task does not repeat
                    batch.delete(taskRef);
                    batch.update(userProfileRef, { tasks: increment(-1) });
                    listIds.forEach((listId) => { // remove task from lists
                        listRef = doc(listsRef, listId);
                        batch.update(listRef, { taskIds: arrayRemove(docId) });
                    })
                    setTaskItems(prevList => [
                        ...prevList.slice(0, index),
                        ...prevList.slice(index + 1)
                    ]);
                }
                if (imageURI) {
                    batch.update(postRef, { image: imageURI });
                }
                await batch.commit();

            } catch (error) {
                // add error if image fails
                console.error('Error updating task completion: ', error);
            }
        }
        else {
            const batch = writeBatch(FIRESTORE_DB);
            const post = completedTaskItems[index];
            const docId = post.id;
            const listIds = post.listIds;
            try {
                const postRef = doc(postsRef, docId);
                const taskRef = doc(tasksRef);
                batch.set(taskRef, {
                    taskName: post.postName,
                    description: post.description,
                    priority: post.priority,
                    reminders: post.reminders,
                    completeByDate: post.completeByDate,
                    isCompletionTime: post.isCompletionTime,
                    listIds: post.listIds,
                    timeTaskCreated: post.timeTaskCreated,
                    notificationIds: [],
                    repeat: null,
                    repeatEnds: null,
                });
                let listRef;
                listIds.forEach((listId) => {
                    listRef = doc(listsRef, listId);
                    batch.update(listRef, { postIds: arrayRemove(docId) });
                    batch.update(listRef, { taskIds: arrayUnion(taskRef.id) })
                })
                const likesRef = collection(postRef, 'Likes');
                const commentsRef = collection(postRef, 'Comments');
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
                batch.update(userProfileRef, { posts: increment(-1) });
                batch.update(userProfileRef, { tasks: increment(1) });
                if (post.reminders.length !== 0) {
                    if (await configureNotifications()) {
                        const tempNotifIds = await scheduleNotifications(post.reminders, post.completeByDate, post.isCompletionTime, post.postName);
                        batch.update(taskRef, { notificationIds: tempNotifIds });
                    }
                }
                const image = post.image;
                if (image) {
                    const imageRef = ref(getStorage(), image);
                    await deleteObject(imageRef);
                }
                setCompletedTaskItems(prevList => [
                    ...prevList.slice(0, index),
                    ...prevList.slice(index + 1)
                ]);
                await batch.commit();

            } catch (error) {
                console.error('Error updating task completion: ', error);
            }
        }
    }

    const isRepeatingTask = (currDueDate, repeatEnds, selectedRepeat) => {
        if (currDueDate == null || selectedRepeat == null) {
            return 0;
        }
        let flag = 0;
        if (currDueDate >= new Date()) { //completed task on time
            flag = 1;
        }
        while (currDueDate < new Date() || flag === 1) { //completed task late
            if (repeatEnds) {
                let tempCurrDueDate = currDueDate;
                tempCurrDueDate.setHours(0, 0, 0, 0);
                repeatEnds.setHours(0, 0, 0, 0);
                if (currDueDate > repeatEnds) {
                    return 0;
                }
            }
            if (selectedRepeat == 0) {
                currDueDate.setDate(currDueDate.getDate() + 1);
            }
            else if (selectedRepeat == 1) {
                currDueDate.setDate(currDueDate.getDate() + 7);
            }
            else if (selectedRepeat == 2) {
                currDueDate.setMonth(currDueDate.getMonth() + 1);
            }
            else if (selectedRepeat == 3) {
                currDueDate.setYear(currDueDate.getFullYear() + 1);
            }
            else {
                if (currDueDate.getDay() === 5) {
                    currDueDate.setDate(currDueDate.getDate() + 3);
                }
                else if (currDueDate.getDay() === 6) {
                    currDueDate.setDate(currDueDate.getDate() + 2);
                }
                else {
                    currDueDate.setDate(currDueDate.getDate() + 1);
                }
            }
            if (flag === 1) {
                break;
            }
        }
        if (repeatEnds) {
            let tempCurrDueDate = currDueDate;
            tempCurrDueDate.setHours(0, 0, 0, 0);
            repeatEnds.setHours(0, 0, 0, 0);
            if (currDueDate > repeatEnds) {
                return 0;
            }
        }
        return {
            day: currDueDate.getDate(),
            month: currDueDate.getMonth() + 1,
            year: currDueDate.getFullYear(),
            timestamp: currDueDate,
            dateString: currDueDate.toISOString().split('T')[0],
        };
    }

    //diffentiate delete post and task and make batch
    const deleteItem = async (index, complete) => {
        let docId;
        let image;
        if (!complete) {
            docId = taskItems[index].id;
        }
        else {
            docId = completedTaskItems[index].id;
            image = completedTaskItems[index].image;
        }
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const listsRef = collection(userProfileRef, 'Lists');
        try {
            const batch = writeBatch(FIRESTORE_DB);
            if (complete) {
                let listRef;
                const postRef = doc(FIRESTORE_DB, 'Posts', docId);
                const likesRef = collection(postRef, 'Likes');
                const commentsRef = collection(postRef, 'Comments');
                completedTaskItems[index].listIds.forEach((listId) => {
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
                setCompletedTaskItems(prevList => [
                    ...prevList.slice(0, index),
                    ...prevList.slice(index + 1)
                ]);
            }
            else {
                let listRef;
                const tasksRef = collection(userProfileRef, 'Tasks');
                const taskRef = doc(tasksRef, docId);
                taskItems[index].listIds.forEach((listId) => {
                    listRef = doc(listsRef, listId);
                    batch.update(listRef, { taskIds: arrayRemove(docId) })
                });
                batch.update(userProfileRef, { tasks: increment(-1) });
                batch.delete(taskRef);
                await cancelNotifications(taskItems[index].notificationIds);
                setTaskItems(prevList => [
                    ...prevList.slice(0, index),
                    ...prevList.slice(index + 1)
                ]);
            }
            await batch.commit();
        } catch (error) {
            console.error('Error deleting document: ', error);
        };

    }

    const configureNotifications = async () => {
        const response = await Notifications.requestPermissionsAsync();
        if (!response.granted) {
            console.warn("⚠️ Notification Permissions not granted!");
            return response.granted;
        }
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
        return response.granted;
    }

    const scheduleNotifications = async (selectedReminders, selectedDate, isTime, newTask) => {
        let notificationArray = [];
        if (!isTime) {
            selectedReminders.forEach(reminder => {
                let date = new Date(selectedDate.timestamp.getTime());
                let body;
                date.setHours(9);
                date.setMinutes(0);
                date.setSeconds(0);
                if (reminder == 0) {
                    body = "Today";
                }
                else if (reminder == 1) {
                    date.setDate(selectedDate.timestamp.getDate() - 1);
                    body = "Tomorrow"
                }
                else if (reminder == 2) {
                    date.setDate(selectedDate.timestamp.getDate() - 2);
                    body = "In 2 days";
                }
                else if (reminder == 3) {
                    date.setDate(selectedDate.timestamp.getDate() - 3);
                    body = "In 3 days";
                }
                else {
                    date.setDate(selectedDate.timestamp.getDate() - 7);
                    body = "In 1 week"
                }
                if (date > new Date()) {
                    notificationArray.push({ date: date, title: newTask, body: body });
                }
            })
        }
        else {
            selectedReminders.forEach(reminder => {
                let date = new Date(selectedDate.timestamp.getTime());
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let body;
                if (reminder == 0) {
                    body = "Now, " + timeString;
                }
                else if (reminder == 1) {
                    date.setMinutes(selectedDate.timestamp.getMinutes() - 5);
                    body = "In 5 minutes, " + timeString;
                }
                else if (reminder == 2) {
                    date.setMinutes(selectedDate.timestamp.getMinutes() - 30);
                    body = "In 30 minutes, " + timeString;
                }
                else if (reminder == 3) {
                    date.setHours(selectedDate.timestamp.getHours() - 1);
                    body = "in 1 hour, " + timeString;
                }
                else {
                    date.setDate(selectedDate.day - 1);
                    body = "Tomorrow, " + timeString;
                }
                if (date > new Date()) {
                    notificationArray.push({ date: date, title: newTask, body: body });
                }
            })
        }
        return await scheduleAllNotifications(notificationArray);
    }

    const scheduleAllNotifications = async (notificationArray) => {
        let notificationIds = [];
        await Promise.all(
            notificationArray.map(async (notification) => {
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: notification.title,
                        body: notification.body,
                        sound: Platform.OS === 'ios' ? "default" : undefined,
                    },
                    trigger: {
                        type: 'date',
                        date: notification.date,
                        allowWhileIdle: true,
                    },
                })
                notificationIds.push(id);
            })
        )
        return notificationIds
    }

    const cancelNotifications = async (notificationIds) => {
        for (const notification of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(notification);
        }
    };

    let swipedCardRef = null;
    const onOpen = ref => {
        if (swipedCardRef) swipedCardRef.current.close();
        swipedCardRef = ref;
    };

    const onClose = ref => {
        if (ref == swipedCardRef) {
            swipedCardRef = null;
        }
    };

    const closeSwipeCard = () => {
        if (swipedCardRef) swipedCardRef.current?.close();
    }

    const handleTaskPress = (index) => {
        closeSwipeCard();
        setEditIndex(index);
        setEditTaskVisible(true);
    }

    const toggleEditTaskVisible = () => {
        setEditTaskVisible(false);
        setEditIndex(null);
    }

    const toggleCompletedTaskVisible = () => {
        setCompletedTaskVisible(false);
        setCompletedTaskIndex(null);
    }

    const handleCompletedTaskPress = (index) => {
        closeSwipeCard();
        setCompletedTaskIndex(index);
        setCompletedTaskVisible(true);
    }

    const openSortModal = () => {
        sortRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setSortYPosition(pageY);
        });
        setSortModalVisible(true);
    }

    const openCameraOptionMenu = () => {
        setCameraOptionModalVisible(true);
        return new Promise((resolve) => setResolver(() => resolve));
    }

    const handleCameraOptionSelect = (option) => {
        if (resolver) {
            resolver(option);
            setResolver(null);
        }
    }

    const testFunction = async () => {
        await logout();
    }

    const uncompleteTaskHelper = (index, complete) => {
        if (!completedTaskItems[index].hidden && Platform.OS === 'ios') {
            setCompletedTaskIndex(index);
            setUncompleteTaskConfirmationVisible(true);
        }
        else {
            completeTask(index, complete);
        }
    }

    const infoHelper = (task) => { //0: priority, 1: dueDate
        // if default show completeByDate -> priority -> nothing
        // if priority show priority only
        // if dueDate show dueDate only
        // if name show same as default

        if (task.completeByDate) {
            return [task.priority, getDueDateString(task.completeByDate.timestamp, task.isCompletionTime)];
        }
        else {
            return [task.priority, null];
        }
        
    }

    return (
        <TouchableWithoutFeedback onPress={closeSwipeCard}>
            <View style={styles.container}>
                <Drawer
                    open={openDrawer}
                    onOpen={() => { closeSwipeCard(); setOpenDrawer(true); }}
                    onClose={() => setOpenDrawer(false)}
                    renderDrawerContent={() => {
                        return <ListSelect setOpenDrawer={setOpenDrawer} listItems={listItems} listId={listId} setListId={setListId} userProfile={userProfile} navigation={navigation} />;
                    }}
                    drawerStyle={{
                        width: '70%',
                        position: 'absolute',
                        zIndex: 9999,
                        elevation: 9999,
                    }}
                >
                    <SafeAreaView style={styles.container}>
                        <Modal
                            visible={isEditTaskVisible}
                            transparent={true}
                            animationType='slide'
                        >
                            <EditTask
                                task={taskItems[editIndex]}
                                setTaskItems={setTaskItems}
                                index={editIndex}
                                listItems={listItems}
                                toggleEditTaskVisible={toggleEditTaskVisible}
                                configureNotifications={configureNotifications}
                                scheduleNotifications={scheduleNotifications}
                                cancelNotifications={cancelNotifications}
                                isRepeatingTask={isRepeatingTask}
                                deleteItem={deleteItem}
                            />
                        </ Modal>
                        <Modal
                            visible={isCompletedTaskVisible}
                            transparent={true}
                            animationType='slide'
                        >
                            <ViewCompletedTask
                                task={completedTaskItems[completedTaskIndex]}
                                listItems={listItems}
                                toggleCompletedTaskVisible={toggleCompletedTaskVisible}
                                index={completedTaskIndex}
                                completeTask={completeTask}
                                deleteItem={deleteItem}
                            />
                        </ Modal>
                        <Modal
                            visible={sortModalVisible}
                            transparent={true}
                            animationType='fade'
                        >
                            <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
                                <View style={styles.sortContainer}>
                                    <TouchableWithoutFeedback>
                                        <View style={{ top: sortYPosition + 40, ...styles.sortButtonContainer }}>
                                            <View style={styles.sortBy}>
                                                <Text style={styles.sortByText}>Sort by:</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => { setOrder("default") }} style={styles.sortButtons}>
                                                <View style={styles.sortNames}>
                                                    <MaterialCommunityIcons name="sort" size={16} color={order == "default" ? (colors.accent) : (colors.primary)} />
                                                    <Text style={[order == "default" ? { color: colors.accent } : { color: colors.primary }, styles.sortText]}>Default</Text>
                                                </View>
                                                {order == "default" && <View>
                                                    <FontAwesome6 name={'check'} size={16} color={colors.accent} />
                                                </View>}
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { setOrder("dueDate") }} style={styles.sortButtons}>
                                                <View style={styles.sortNames}>
                                                    <MaterialCommunityIcons name="sort-calendar-ascending" size={16} color={order == "dueDate" ? (colors.accent) : (colors.primary)} />
                                                    <Text style={[order == "dueDate" ? { color: colors.accent } : { color: colors.primary }, styles.sortText]}>Due Date</Text>
                                                </View>
                                                {order == "dueDate" && <View>
                                                    <FontAwesome6 name={'check'} size={16} color={colors.accent} />
                                                </View>}
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { setOrder("priority") }} style={styles.sortButtons}>
                                                <View style={styles.sortNames}>
                                                    <Icon name="flag" size={16} color={order == "priority" ? (colors.accent) : (colors.primary)} />
                                                    <Text style={[order == "priority" ? { color: colors.accent } : { color: colors.primary }, styles.sortText]}>Priority</Text>
                                                </View>
                                                {order == "priority" && <View>
                                                    <FontAwesome6 name={'check'} size={16} color={colors.accent} />
                                                </View>}
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { setOrder("name") }} style={styles.sortButtons}>
                                                <View style={styles.sortNames}>
                                                    <MaterialCommunityIcons name="sort-alphabetical-ascending" size={16} color={order == "name" ? (colors.accent) : (colors.primary)} />
                                                    <Text style={[order == "name" ? { color: colors.accent } : { color: colors.primary }, styles.sortText]}>Name</Text>
                                                </View>
                                                {order == "name" && <View>
                                                    <FontAwesome6 name={'check'} size={16} color={colors.accent} />
                                                </View>}
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                        <Modal
                            visible={cameraOptionModalVisible}
                            transparent={true}
                            animationType='slide'
                        >
                            <TouchableWithoutFeedback onPress={() => { handleCameraOptionSelect("cancel"); setCameraOptionModalVisible(false) }}>
                                <View style={{ flex: 1 }} />
                            </TouchableWithoutFeedback>
                            <CameraOptionMenu
                                onChoose={handleCameraOptionSelect}
                            />
                        </Modal>
                        <Modal
                            visible={isUncompleteTaskConfirmationVisible}
                            transparent={true}
                            animationType='fade'
                        >
                            <ConfirmationModal
                                confirm={async()=>{ setCompletedTaskIndex(null); setUncompleteTaskConfirmationVisible(false); await completeTask(completedTaskIndex, true);}}
                                deny={()=>{setCompletedTaskIndex(null); setUncompleteTaskConfirmationVisible(false)}}
                                cancel={() => {}}
                                title={"Delete post?"}
                                description={"This will delete the post associated with this task and will mark this task as incomplete."}
                                confirmText={"Delete"}
                                denyText={"Cancel"}
                                confirmColor={colors.red}
                                denyColor={colors.primary}
                            />
                        </ Modal>
                        <View style={styles.topBorder}>
                            <TouchableOpacity onPress={() => { closeSwipeCard(); setOpenDrawer(true) }}>
                                <Ionicons name="menu" size={32} color={colors.primary} />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 1, paddingRight: 5, }}>
                                <CheckedPost width={42} height={42} />
                                <TouchableOpacity onPress={testFunction}>
                                    <Text style={styles.title}>Doozy</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity ref={sortRef} onPress={() => { if (Platform.OS === 'ios'){closeSwipeCard(); openSortModal();} else {}}}>
                                {order === "default" ? 
                                    <MaterialCommunityIcons name="sort" size={32} color={colors.primary} />
                                    :
                                    (order === "dueDate" ? 
                                        <MaterialCommunityIcons name="sort-calendar-ascending" size={32} color={colors.primary} />
                                        : 
                                        (order === "priority" ?
                                            <Icon name="flag" size={32} color={colors.primary} />
                                            :
                                            <MaterialCommunityIcons name="sort-alphabetical-ascending" size={32} color={colors.primary} />
                                        )
                                    )
                                }
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.scrollView} refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }>
                            <View style={styles.tasksContainer}>
                                <Text style={styles.sectionTitle}>{currList}</Text>
                                {taskItems.length === 0 && (<View style={styles.emptyTasks}>
                                    <FontAwesome name={"pencil-square-o"} color={colors.primary} size={30} />
                                    <Text style={styles.emptyTasksText}>No tasks yet</Text>
                                    <Text style={styles.emptyTasksText}>Tap + to get started!</Text>
                                </View>)}
                                <View style={styles.tasks}>
                                    {taskItems.map((task, index) => {
                                        const isFirst = index == 0;
                                        const isLast = index == taskItems.length - 1;
                                        return (
                                            <TouchableOpacity onPress={() => Platform.OS === 'ios'?  handleTaskPress(index) : {}} key={index} style={[styles.taskContainer, isFirst && styles.firstTask, isLast && styles.lastTask]}>
                                                <Task
                                                    text={task.taskName}
                                                    tick={completeTask}
                                                    i={index}
                                                    complete={false}
                                                    deleteItem={deleteItem}
                                                    onOpen={onOpen}
                                                    onClose={onClose}
                                                    isFirst={isFirst}
                                                    isLast={isLast}
                                                    isSelected={index === editIndex}
                                                    hidden={false}
                                                    info={infoHelper(task)}
                                                />
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>
                            {completedTaskItems.length !== 0 && <View style={styles.tasksContainer}>
                                <Text style={styles.sectionTitle}>Completed</Text>
                                <View style={styles.tasks}>
                                    {completedTaskItems.map((task, index) => {
                                        const isFirst = index == 0;
                                        const isLast = index == completedTaskItems.length - 1;
                                        return (
                                            <TouchableOpacity onPress={() => Platform.OS === 'ios' ? handleCompletedTaskPress(index) : {}} key={index} style={[styles.taskContainer, isFirst && styles.firstTask, isLast && styles.lastTask]}>
                                                <Task
                                                    text={task.postName}
                                                    tick={uncompleteTaskHelper}
                                                    i={index}
                                                    complete={true}
                                                    deleteItem={deleteItem}
                                                    onOpen={onOpen}
                                                    onClose={onClose}
                                                    isFirst={isFirst}
                                                    isLast={isLast}
                                                    isSelected={index === completedTaskIndex}
                                                    hidden={task.hidden}
                                                    info={null}
                                                />
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>}
                        </ScrollView>
                        <TaskCreation
                            closeSwipeCard={closeSwipeCard}
                            listItems={listItems}
                            selectedLists={selectedLists}
                            setSelectedLists={setSelectedLists}
                            nav={props.navigation}
                            configureNotifications={configureNotifications}
                            scheduleNotifications={scheduleNotifications}
                            isRepeatingTask={isRepeatingTask}
                        />
                    </SafeAreaView>
                </Drawer>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topBorder: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    title: {
        fontSize: 32,
        color: colors.primary,
        fontFamily: fonts.bold,
    },
    sortContainer: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    sortButtonContainer: {
        height: 190,
        backgroundColor: colors.surface,
        width: 150,
        borderRadius: 15,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        right: 20,
        position: 'absolute',
        overflow: 'hidden'
    },
    sortBy: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginLeft: 10,
    },
    sortByText: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.primary,
    },
    sortNames: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    sortButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 40,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    sortText: {
        marginLeft: 10,
        fontFamily: fonts.regular,
    },
    scrollView: {
        paddingTop: 10,
        marginBottom: 40,
    },
    taskContainer: {
        backgroundColor: colors.red,
    },
    firstTask: {
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
    },
    lastTask: {
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    tasksContainer: {
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    emptyTasks: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
    },
    emptyTasksText: {
        fontFamily: fonts.regular,
        color: colors.fade,
        fontSize: 16,
    },
    tasks: {
        backgroundColor: colors.surface,
        marginTop: 5,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
})
export default TaskListScreen;