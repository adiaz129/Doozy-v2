import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Platform, TextInput, Text, View, TouchableOpacity, TouchableWithoutFeedback, Dimensions, Modal, Keyboard, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { Ionicons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListModal from './PopUpMenus/ListModal';
import ScheduleMenu from './ScheduleMenu';
import CameraOptionMenu from './PopUpMenus/CameraOptionMenu';
import { doc, collection, addDoc, runTransaction, writeBatch, increment, arrayUnion } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB, uploadToFirebase } from '../../../firebaseConfig';
import { addImage, takePhoto } from '../../utils/photoFunctions';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import UncheckedTask from '../../assets/unchecked-task.svg';
import CheckedTask from '../../assets/checked-task.svg';
import axios from 'axios';


const TaskCreation = (props) => {
    const { closeSwipeCard, listItems, selectedLists, setSelectedLists, nav, configureNotifications, scheduleNotifications, isRepeatingTask, cancelNotifications } = props;

    const textTaskInputRef = useRef(null);

    const [task_name, setTask_name] = useState(''); // Task Name
    const [description, setDescription] = useState(''); // Task Description
    const [complete_by_date, setComplete_by_date] = useState(null);
    const [priority, setPriority] = useState(0);
    const [reminders, setReminders] = useState([]);
    const [repeat_interval, setRepeat_interval] = useState(null);
    const [is_completed, setIs_completed] = useState(false);
    const [is_completion_time, setIs_completion_time] = useState(false);
    const [repeat_ends, setRepeat_ends] = useState(null);
    const [hidden, setHidden] = useState(false);

    const [showPriority, setShowPriority] = useState(false);
    const [isTaskCreationModalVisible, setTaskCreationModalVisible] = useState(false);
    const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);
    const [isListModalVisible, setListModalVisible] = useState(false);
    const [cameraOptionModalVisible, setCameraOptionModalVisible] = useState(false);
    const [resolver, setResolver] = useState(null);

    const currentUser = FIREBASE_AUTH.currentUser;

    const modalHeight = 730;
    const taskCreationHeight = 135;

    const animatedHeight = useRef(new Animated.Value(taskCreationHeight)).current;

    useEffect(() => {
        const willShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
            Animated.timing(animatedHeight, {
                toValue: taskCreationHeight + e.endCoordinates.height,
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });

        const willHideSub = Keyboard.addListener('keyboardWillHide', (e) => {
            Animated.timing(animatedHeight, {
                toValue: 0,
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });

        return () => {
            willShowSub.remove();
            willHideSub.remove();
        };
    }, []);

    const storeTask = async (image, post) => {
        try {
            let notifications = []
            if (reminders.length !== 0) {
                if (await configureNotifications()) {
                    notifications = await scheduleNotifications(reminders, complete_by_date, is_completion_time, task_name);
                }
            }
            let mysqlTimestampCompleteBy;
            let mysqlTimestampRepeatEnds;
            if (complete_by_date) {
                const dateObj1 = new Date(complete_by_date.timestamp);
                mysqlTimestampCompleteBy = dateObj1.toISOString().slice(0, 19).replace('T', ' ');
            }
            if (repeat_ends) {
                const dateObj2 = new Date(repeat_ends);
                mysqlTimestampRepeatEnds = dateObj2.toISOString().slice(0, 19).replace('T', ' ');
            }
            const response = await axios.post('http://localhost:8800/api/tasks', {
                    task_name, 
                    description, 
                    complete_by_date: complete_by_date ? mysqlTimestampCompleteBy : null, 
                    is_completion_time, 
                    priority, 
                    repeat_interval, 
                    repeat_ends: repeat_ends ? mysqlTimestampRepeatEnds : null, 
                    is_completed, 
                    post, 
                    selectedLists, 
                    reminders, 
                    notifications, 
                    image
                });
            if (response.data.success) {
                console.log(response.data.message);
            }
        } catch (error) { // add an error check for 401 and logout
            console.log(error.response.data.message);
            // await cancelNotifications(notifications);
        }
    }

    // const storeTask = async (imageURI, hidden) => {
    //     is_completed ? cookedBatch = await storeCompletedTask(taskRef, batch, imageURI, hidden) : cookedBatch = await storeIncompletedTask(false, taskRef, batch);
    //     await cookedBatch.commit();
    //     setTaskCreationModalVisible(false);
    // }

    // const storeIncompletedTask = async (blockNotifications, taskRef, batch) => {
    //     const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
    //     try {
    //         batch.set(taskRef, {
    //             taskName: task_name,
    //             description: description,
    //             completeByDate: complete_by_date,
    //             isCompletionTime: is_completion_time,
    //             priority: priority,
    //             reminders: reminders,
    //             repeat_interval: repeat_interval,
    //             repeatEnds: repeat_ends,
    //             listIds: selectedLists,
    //             timeTaskCreated: new Date(),
    //             notificationIds: [],
    //         });
    //         let listRef;
    //         selectedLists.forEach((listId) => {
    //             listRef = doc(userProfileRef, 'Lists', listId);
    //             batch.update(listRef, { taskIds: arrayUnion(taskRef.id) });
    //         });
    //         batch.update(userProfileRef, { tasks: increment(1) });
    //         if (!blockNotifications && reminders.length !== 0) {
    //             if (await configureNotifications()) {
    //                 const tempNotifIds = await scheduleNotifications(reminders, complete_by_date, is_completion_time, task_name);
    //                 batch.update(taskRef, { notificationIds: tempNotifIds });
    //             }
    //         }
    //         return batch;
    //     } catch (error) {
    //         console.error("Error storing task:", error);
    //     }
    // }

    // const storeCompletedTask = async (taskRef, batch, imageURI, hidden) => {
    //     const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
    //     const postsRef = collection(FIRESTORE_DB, 'Posts');
    //     const postRef = doc(postsRef);

    //     try {
    //         batch.set(postRef, {
    //             userId: currentUser.uid,
    //             postName: task_name,
    //             description: description,
    //             timePosted: new Date(),
    //             timeTaskCreated: new Date(),
    //             image: imageURI,
    //             completeByDate: complete_by_date,
    //             isCompletionTime: is_completion_time,
    //             priority: priority,
    //             reminders: reminders,
    //             listIds: selectedLists,
    //             hidden: hidden,
    //             likeCount: 0,
    //             commentCount: 0,
    //         })
    //         let listRef;
    //         selectedLists.forEach((listId) => {
    //             listRef = doc(userProfileRef, 'Lists', listId);
    //             batch.update(listRef, { postIds: arrayUnion(postRef.id) });
    //         });
    //         let newCompleteByDate;
    //         if (complete_by_date && (newCompleteByDate = isRepeatingTask(complete_by_date.timestamp, repeat_ends, repeat_interval))) {
    //             batch = await storeIncompletedTask(true, taskRef, batch);
    //             batch.update(taskRef, { completeByDate: newCompleteByDate });
    //             if (reminders.length !== 0) {
    //                 if (await configureNotifications()) {
    //                     const tempNotifIds = await scheduleNotifications(reminders, newCompleteByDate, is_completion_time, task_name);
    //                     batch.update(taskRef, { notificationIds: tempNotifIds });
    //                 }
    //             }
    //         }
    //         batch.update(userProfileRef, { posts: increment(1) });
    //         return batch;
    //     } catch (error) {
    //         console.error("Error storing post:", error);
    //     }
    // }

    const toggleCalendarModal = () => {
        setCalendarModalVisible(!isCalendarModalVisible);
    };

    const toggleListModal = () => {
        setListModalVisible(!isListModalVisible);
    };

    const openTaskCreationModal = () => {
        closeSwipeCard();
        setTaskCreationModalVisible(true);
        setTimeout(() => {
            textTaskInputRef?.current?.focus();
        }, 10);
    };

    const closeTaskCreationModal = () => {
        Keyboard.dismiss();
        setTimeout(() => {
            setTaskCreationModalVisible(false);
        }, 100);
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

    const handleSubmitHelper = async () => {
        if (is_completed) {
            let imageURI;
            let post = true;
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
            setCameraOptionModalVisible(false); //add loading screen here
            storeTask(imageURI, post);
        }
        else {
            storeTask(null, false);
        }
        setTask_name('');
        setDescription('');
        setIs_completed(false);
        setSelectedLists([]);
        setComplete_by_date(null);
        setPriority(0);
        setReminders([]);
        setRepeat_interval(null);
        setIs_completion_time(false);
        setRepeat_ends(null);
        setShowPriority(false);
        setHidden(false);
    };


    const checker = () => {
        is_completed ? setIs_completed(false) : setIs_completed(true);
    }

    const flagColor = [colors.primary, colors.secondary, colors.accent, colors.red];

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={isTaskCreationModalVisible}
                transparent={true}
                animationType='slide'
            >
                <Modal
                    visible={isCalendarModalVisible}
                    transparent={true}
                    animationType="slide"
                >
                    <TouchableWithoutFeedback onPress={toggleCalendarModal}>
                        <View style={{ flex: 1 }}>
                        </View>
                    </TouchableWithoutFeedback>
                    <View style={{ height: modalHeight, ...styles.calendarModalContainer }}>
                        <ScheduleMenu
                            setCalendarModalVisible={setCalendarModalVisible}
                            selectedDate={complete_by_date}
                            setSelectedDate={setComplete_by_date}
                            isTime={is_completion_time}
                            setIsTime={setIs_completion_time}
                            selectedReminders={reminders}
                            setSelectedReminders={setReminders}
                            selectedRepeat={repeat_interval}
                            setSelectedRepeat={setRepeat_interval}
                            dateRepeatEnds={repeat_ends}
                            setDateRepeatEnds={setRepeat_ends}
                        />

                    </View>
                </Modal>
                <Modal
                    visible={isListModalVisible}
                    transparent={true}
                    animationType='slide'
                >
                    <TouchableWithoutFeedback onPress={toggleListModal}>
                        <View style={{ flex: 1 }}>
                        </View>
                    </TouchableWithoutFeedback>
                    <ListModal
                        selectedLists={selectedLists}
                        setSelectedLists={setSelectedLists}
                        listItems={listItems}
                        setListModalVisible={setListModalVisible}
                    />
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
                <TouchableWithoutFeedback onPress={closeTaskCreationModal}>
                    <View style={{ flex: 1 }}>
                    </View>
                </TouchableWithoutFeedback>
                <Animated.View style={{ height: animatedHeight, ...styles.taskCreationContainer }}>
                    <View>
                        <View style={styles.inputWrapper}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={checker} style={styles.checkedbox}>
                                    {is_completed ? (
                                        <CheckedTask width={32} height={32} />
                                    ) : (
                                        <UncheckedTask width={32} height={32} />
                                    )}
                                </TouchableOpacity>
                                <TextInput
                                    ref={textTaskInputRef}
                                    style={styles.inputTask}
                                    onChangeText={text => { setTask_name(text)}}
                                    value={task_name}
                                    placeholder={'Type your task here...'}
                                    placeholderTextColor={'#C7C7CD'}
                                    autoCorrect={false}
                                />
                            </View>
                            {task_name.length > 0 && <TouchableOpacity onPress={handleSubmitHelper}>
                                <Ionicons name={'arrow-up-circle'} size={28} color={colors.accent} />
                            </TouchableOpacity>}
                        </View>
                        <View style={styles.descriptionWrapper}>
                            <TextInput
                                style={styles.inputDescription}
                                onChangeText={text => setDescription(text)}
                                value={description}
                                placeholder={'Description…'}
                                placeholderTextColor={'#C7C7CD'}
                            />
                        </View>
                        <View style={styles.detailsWrapper}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={toggleCalendarModal}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon
                                        name="calendar"
                                        size={28}
                                        color={complete_by_date ? colors.accent : colors.primary}
                                    />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={toggleListModal}
                            >
                                <View style={styles.iconContainer}>
                                    {selectedLists.length === 0 ?
                                        <FontAwesome5 name="list-ul" size={28} color={colors.primary} />
                                        :
                                        <FontAwesome5 name="list-alt" size={28} color={colors.accent} />
                                    }
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() => { setShowPriority(!showPriority) }}
                            >
                                <View style={styles.iconContainer}>
                                    {!showPriority ? (<Icon
                                        name="flag"
                                        size={28}
                                        color={flagColor[priority]}
                                    />)
                                        : (<Feather name="x-circle" size={28} color={colors.primary} />)}
                                </View>
                            </TouchableOpacity>
                            {showPriority && (<View style={styles.priorityContainer}>
                                <TouchableOpacity onPress={() => { priority == 1 ? setPriority(0) : setPriority(1) }} style={[priority == 1 ? { width: 75, ...styles.priorityButton } : { width: 60 }, styles.priorityButtonLow]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[1]}
                                        />
                                        <Text style={styles.priorityText}>Low</Text>
                                        {priority == 1 && <Feather name="x" size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { priority == 2 ? setPriority(0) : setPriority(2) }} style={[priority == 2 ? { width: 80, ...styles.priorityButton } : { width: 65 }, styles.priorityButtonMed]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[2]}
                                        />
                                        <Text style={styles.priorityText}>Med</Text>
                                        {priority == 2 && <Feather name="x" size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { priority == 3 ? setPriority(0) : setPriority(3) }} style={[priority == 3 ? { width: 85, ...styles.priorityButton } : { width: 70 }, styles.priorityButtonHigh]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[3]}
                                        />
                                        <Text style={styles.priorityText}>High</Text>
                                        {priority == 3 && <Feather name="x" size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                            </View>)}
                        </View>
                    </View>
                </Animated.View>
            </Modal>
            <View style={styles.bottomBar}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={openTaskCreationModal} style={styles.addTaskButton}>
                        <AntDesign name="pluscircle" size={64} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0, //temporary
        left: 0,
        right: 0,
    },
    calendarModalContainer: {
        paddingRight: 20,
        paddingLeft: 20,
        backgroundColor: colors.surface,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4
    },
    writeTaskWrapper: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    buttonContainer: {
        position: 'absolute',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        right: 16,
        bottom: 60,
    },
    taskCreationContainer: {
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
    inputWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 10,
    },
    inputTask: {
        fontSize: 14,
        paddingVertical: 15,
        paddingHorizontal: 10,
        width: '80%',
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    submitButton: {

    },
    folderButton: {
        width: 60,
        flex: 0,
    },
    addTaskButtonWrapper: {
        width: 60,
        height: 60,
        backgroundColor: '#FFF',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#C0C0C0',
        borderWidth: 1,
        marginRight: 20,
    },
    addTaskText: {
        fontSize: 48,
    },
    checkedbox: {
        marginLeft: 10,
    },
    inputDescription: {
        fontSize: 13,
        paddingVertical: 10,
        paddingHorizontal: 15,
        width: '100%',
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    detailsWrapper: {
        marginHorizontal: 5,
        flexDirection: 'row',
        justifyContent: 'left',
        alignItems: 'center',

    },
    iconContainer: {
        padding: 10

    },
    menuContainer: {
        width: 300,
    },
    listsMenu: {
        backgroundColor: 'transparent',
    },
    listsMenuScroll: {
        position: 'absolute',
        backgroundColor: 'white',
        borderColor: 'grey',
        borderWidth: 1,
        bottom: 90, // change
        width: 200,
        borderRadius: 5,
        maxHeight: 150,
    },
    listsMenuSelect: {
        flex: .55,
        paddingTop: 10,
        backgroundColor: 'white',
        borderColor: 'grey',
        borderWidth: 1,
        borderRadius: 5,
    },
    multiSelectBox: {
        margin: 0,
        padding: 5,
    },
    listModal: {

    },
    priorityWrapper: {
        flexDirection: "row",
        alignItems: 'center',
        paddingVertical: 2,
    },
    flagSmall: {
        paddingRight: 20,
    },
    flagText: {
        fontSize: 18,
    },
    priorityContainer: {
        paddingLeft: 0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flex: 1,
        verticalAlign: 'center',
        rowGap: 10,
    },
    priorityButton: {
        backgroundColor: colors.tint,
    },
    priorityButtonLow: {
        height: 30,
        marginRight: 5,
        borderWidth: 1,
        borderRadius: 15,
        justifyContent: 'center',
        borderColor: colors.primary,
    },
    priorityButtonMed: {
        height: 30,
        marginRight: 5,
        borderWidth: 1,
        borderRadius: 15,
        justifyContent: 'center',
        borderColor: colors.primary,
    },
    priorityButtonHigh: {
        height: 30,
        borderWidth: 1,
        borderRadius: 15,
        justifyContent: 'center',
        borderColor: colors.primary,
    },
    priorityButtonContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center'
    },
    priorityText: {
        marginLeft: 5,
        marginRight: 2,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.primary
    },
    customItem: {
        margin: 0,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: 'lightgray',
        borderRadius: 10,
        padding: 5,
        margin: 5,
    },
    chipText: {
        fontSize: 14,
    },
    addTaskButton: {
        height: 64,
        width: 64,
        backgroundColor: colors.surface,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4
    },
    titleText: {
        fontSize: 18,
    },
})

export default TaskCreation;