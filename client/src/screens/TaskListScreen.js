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
import axios from 'axios';


const TaskListScreen = (props) => {

    const { navigation } = props;
    const { logout } = useContext(AuthContext); //remove
    const [order, setOrder] = useState("default");
    const [listId, setListId] = useState(0);
    const [allTasks, setAllTasks] = useState([]);
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

    const [selectedLists, setSelectedLists] = useState([]);

    useEffect(() => {
        fetchLists();
        fetchTasks();
    }, [refreshing]);

    useEffect(() => {
        organizeTasks(allTasks);
    }, [order, listId, allTasks]);

    useEffect(() => {
        updateListDetails(listItems);
    }, [listId])

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`http://localhost:8800/api/tasks`);
            const fetchedTasks = response.data.body.map(task => ({
                ...task,
                time_task_created: new Date(task.time_task_created),
                complete_by_date: task.complete_by_date ? new Date(task.complete_by_date) : null,
                repeat_ends: task.repeat_ends ? new Date(task.repeat_ends) : null,
                time_task_completed: task.time_task_completed? new Date(task.time_task_completed) : null,
            }));
            setAllTasks(fetchedTasks);
        } catch (error) {
            console.error("Error fetching tasks:",  error.response.data.message);
        } finally {
            setRefreshing(false);
        }
    }

    const fetchLists = async () => {
        try {
            const response = await axios.get(`http://localhost:8800/api/lists`);
            const fetchedLists = response.data.body.map(list => ({
                ...list,
                time_list_created: new Date(list.time_list_created)
            }));
            setListItems(fetchedLists);
            updateListDetails(fetchedLists);
        } catch (error) {
            console.error("Error fetching lists:", error);
        }
    }

    const organizeTasks = (fetchedTasks) => {
        const fetchedIncompletedTasks = fetchedTasks.filter((task) => {
            return (listId === 0 || task.lists.includes(listId)) && !task.is_completed;
        })
        const fetchedCompletedTasks = fetchedTasks.filter((task) => {
            return (listId === 0 || task.lists.includes(listId)) && task.is_completed;
        })
        sortTasks(fetchedIncompletedTasks);
        sortCompletedTasks(fetchedCompletedTasks);
    }

    const sortTasks = (fetchedTasks) => {
        let sortedFetchedTasks = [];
        if (order == "default") { //completeByDate -> priority -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (!a.complete_by_date && b.complete_by_date) {
                    return 1
                }
                else if (a.complete_by_date && !b.complete_by_date) {
                    return -1
                }
                else if ((!a.complete_by_date && !b.complete_by_date) || (a.complete_by_date && b.complete_by_date && a.complete_by_date === b.complete_by_date)) {
                    if (a.priority - b.priority !== 0) {
                        return b.priority - a.priority;
                    }
                    else {
                        return b.time_task_created - a.time_task_created;
                    }
                }
                else {
                    return a.complete_by_date - b.complete_by_date;
                }
            })
        }
        else if (order == "priority") { //priority -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (a.priority - b.priority !== 0) {
                    return b.priority - a.priority;
                }
                else {
                    return b.time_task_created - a.time_task_created;
                }
            })
        }
        else if (order == "dueDate") { // completeByDate -> timeTaskCreated
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                if (!a.complete_by_date && b.complete_by_date) {
                    return 1
                }
                else if (a.complete_by_date && !b.complete_by_date) {
                    return -1
                }
                else if ((!a.complete_by_date && !b.complete_by_date) || (a.completeByDate && b.completeByDate && a.completeByDate.timestamp === b.completeByDate.timestamp)) {
                    return b.time_task_created - a.time_task_created;
                }
                else {
                    return a.complete_by_date - b.complete_by_date;
                }
            })
        }
        else { // name
            sortedFetchedTasks = fetchedTasks.slice().sort((a, b) => {
                return a.task_name.localeCompare(b.task_name);
            })
        }
        setTaskItems(sortedFetchedTasks);
    }

    const sortCompletedTasks = (fetchedCompletedTasks) => {
        const sortedCompletedTasks = fetchedCompletedTasks.slice().sort((a, b) => {
            if (a.time_task_completed < b.time_task_completed) {
                return 1
            }
            else {
                return -1
            }
        })
        setCompletedTaskItems(sortedCompletedTasks);
    }

    const updateListDetails = (fetchedLists) => {
        const foundList = fetchedLists.find((fetchedList) => fetchedList.list_id === listId);
        if (listId === 0) {
            setCurrList("Master List");
            setSelectedLists([]);
        }
        else {
            setCurrList(foundList.list_name);
            setSelectedLists([foundList.list_id]);
        }
    }

    const completeTask = async (index, complete) => { // clean this
        if (!complete) { // task --> post
            const task = taskItems[index];
            try {
                let imageURI;
                let post = true;
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
                            post = false;
                            break;
                        }
                        else {
                            imageURI = null;
                            break;
                        }
                    }
                    setCameraOptionModalVisible(false);
                }

                let newCompleteByDate;
                let tempNotifIds = [];
                if (task.complete_by_date && (newCompleteByDate = isRepeatingTask(task.complete_by_date, task.repeat_ends, task.repeat_interval))) {// check if task repeats and return next possible date
                    if (task.reminders.length !== 0) { // schedule notifications
                        if (await configureNotifications()) {
                            tempNotifIds = await scheduleNotifications(task.reminders, newCompleteByDate, task.is_completion_time, task.task_name);
                        }
                    }
                }



                const response = await axios.patch(`http://localhost:8800/api/tasks/${task.task_id}`, {
                    completing: true,
                    task_name: task.task_name,
                    description: task.description,
                    is_completed: true,
                    post: post,
                    image: imageURI,
                    new_complete_by_date: newCompleteByDate ? new Date(newCompleteByDate).toISOString().slice(0, 19).replace('T', ' ') : 0,
                    new_notifications: tempNotifIds,
                });
                if (response.data.success) {
                    console.log(response.data.message);
                    let updatedTasks = allTasks.map(currTask =>
                            currTask.task_id === task.task_id
                                ? {...currTask, is_completed: true, time_task_completed: new Date() }
                                : currTask  
                        );
                    if (response.data.new_task_id) {
                        updatedTasks.push({...task, task_id: response.data.new_task_id, complete_by_date: new Date(newCompleteByDate), notifications: tempNotifIds, time_task_created: new Date()});
                    }
                    setAllTasks(updatedTasks);
                    await cancelNotifications(task.notifications);
                }

            } catch (error) {
                // add error if image fails
                console.error('Error updating task completion: ', error);
                console.log(error.response.data.message);
            }
        }
        else {
            const task = completedTaskItems[index];
            try {
                let tempNotifIds = [];
                if (task.reminders.length !== 0) {
                    if (await configureNotifications()) {
                        tempNotifIds = await scheduleNotifications(task.reminders, task.complete_by_date, task.is_completion_time, task.task_name);
                    }
                }
                const response = await axios.patch(`http://localhost:8800/api/tasks/${task.task_id}`, {
                    uncompleting: true,
                    is_completed: false,
                    notifications: tempNotifIds
                });

                if (response.data.success) {
                    console.log(response.data.message);
                    let updatedTasks = allTasks.map(currTask =>
                            currTask.task_id === task.task_id
                                ? {...currTask, is_completed: false, time_task_completed: null, repeat_interval: null, repeat_ends: null }
                                : currTask  
                        );
                    setAllTasks(updatedTasks);
                }

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
        return currDueDate;
    }

    const deleteItem = async (index, complete) => {
        let taskId = complete ? completedTaskItems[index].task_id : taskItems[index].task_id
        
        try {
            const response = await axios.delete(`http://localhost:8800/api/tasks/${taskId}`);
            if (response.data.success) {
                console.log(response.data.message)
                const updatedTasks = allTasks.filter(task => task.task_id !== taskId);
                setAllTasks(updatedTasks);
                await cancelNotifications(taskItems[index].notifications);
            }
        } catch (error) {
            console.error('Error deleting document: ', error.response.data.message);
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
                let date = new Date(selectedDate.getTime());
                let body;
                date.setHours(9);
                date.setMinutes(0);
                date.setSeconds(0);
                if (reminder == 0) {
                    body = "Today";
                }
                else if (reminder == 1) {
                    date.setDate(selectedDate.getDate() - 1);
                    body = "Tomorrow"
                }
                else if (reminder == 2) {
                    date.setDate(selectedDate.getDate() - 2);
                    body = "In 2 days";
                }
                else if (reminder == 3) {
                    date.setDate(selectedDate.getDate() - 3);
                    body = "In 3 days";
                }
                else {
                    date.setDate(selectedDate.getDate() - 7);
                    body = "In 1 week"
                }
                if (date > new Date()) {
                    notificationArray.push({ date: date, title: newTask, body: body });
                }
            })
        }
        else {
            selectedReminders.forEach(reminder => {
                let date = new Date(selectedDate.getTime());
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let body;
                if (reminder == 0) {
                    body = "Now, " + timeString;
                }
                else if (reminder == 1) {
                    date.setMinutes(selectedDate.getMinutes() - 5);
                    body = "In 5 minutes, " + timeString;
                }
                else if (reminder == 2) {
                    date.setMinutes(selectedDate.getMinutes() - 30);
                    body = "In 30 minutes, " + timeString;
                }
                else if (reminder == 3) {
                    date.setHours(selectedDate.getHours() - 1);
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

    const infoHelper = (task) => { //0: priority, 1: dueDate
        // if default show completeByDate -> priority -> nothing
        // if priority show priority only
        // if dueDate show dueDate only
        // if name show same as default

        if (task.complete_by_date) {
            return [task.priority, getDueDateString(task.complete_by_date, task.is_completion_time)];
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
                        return <ListSelect setOpenDrawer={setOpenDrawer} listItems={listItems} listId={listId} setListId={setListId} userProfile={userProfile} />;
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
                                allTasks={allTasks}
                                setAllTasks={setAllTasks}
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
                            <RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true)}} />
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
                                                    text={task.task_name}
                                                    tick={completeTask}
                                                    i={index}
                                                    complete={false}
                                                    deleteItem={deleteItem}
                                                    onOpen={onOpen}
                                                    onClose={onClose}
                                                    isFirst={isFirst}
                                                    isLast={isLast}
                                                    isSelected={index === editIndex}
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
                                                    text={task.task_name}
                                                    tick={completeTask}
                                                    i={index}
                                                    complete={true}
                                                    deleteItem={deleteItem}
                                                    onOpen={onOpen}
                                                    onClose={onClose}
                                                    isFirst={isFirst}
                                                    isLast={isLast}
                                                    isSelected={index === completedTaskIndex}
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
                            setAllTasks= {setAllTasks}
                            listItems={listItems}
                            selectedLists={selectedLists}
                            setSelectedLists={setSelectedLists}
                            nav={props.navigation}
                            configureNotifications={configureNotifications}
                            scheduleNotifications={scheduleNotifications}
                            isRepeatingTask={isRepeatingTask}
                            cancelNotifications={cancelNotifications}
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
        height: 100
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