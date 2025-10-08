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


const TaskCreation = (props) => {
    const { closeSwipeCard, listItems, selectedLists, setSelectedLists, nav, configureNotifications, scheduleNotifications, isRepeatingTask } = props;

    const textTaskInputRef = useRef(null);

    const [newTask, setNewTask] = useState(''); // Task Name
    const [newDescription, setNewDescription] = useState(''); // Task Description
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState(0);
    const [selectedReminders, setSelectedReminders] = useState([]);
    const [selectedRepeat, setSelectedRepeat] = useState(null);
    const [isCompleted, setCompleted] = useState(false);
    const [isTime, setIsTime] = useState(false);
    const [dateRepeatEnds, setDateRepeatEnds] = useState(null);
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

    const storeTask = async (imageURI, hidden) => {
        if (!currentUser) {
            console.error("Current user not found.");
            return;
        }
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const tasksRef = collection(userProfileRef, 'Tasks');
        const taskRef = doc(tasksRef);

        const batch = writeBatch(FIRESTORE_DB);
        let cookedBatch;
        isCompleted ? cookedBatch = await storeCompletedTask(taskRef, batch, imageURI, hidden) : cookedBatch = await storeIncompletedTask(false, taskRef, batch);
        await cookedBatch.commit();
        setTaskCreationModalVisible(false);
    }

    const storeIncompletedTask = async (blockNotifications, taskRef, batch) => {
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        try {
            batch.set(taskRef, {
                taskName: newTask,
                description: newDescription,
                completeByDate: selectedDate,
                isCompletionTime: isTime,
                priority: selectedPriority,
                reminders: selectedReminders,
                repeat: selectedRepeat,
                repeatEnds: dateRepeatEnds,
                listIds: selectedLists,
                timeTaskCreated: new Date(),
                notificationIds: [],
            });
            let listRef;
            selectedLists.forEach((listId) => {
                listRef = doc(userProfileRef, 'Lists', listId);
                batch.update(listRef, { taskIds: arrayUnion(taskRef.id) });
            });
            batch.update(userProfileRef, { tasks: increment(1) });
            if (!blockNotifications && selectedReminders.length !== 0) {
                if (await configureNotifications()) {
                    const tempNotifIds = await scheduleNotifications(selectedReminders, selectedDate, isTime, newTask);
                    batch.update(taskRef, { notificationIds: tempNotifIds });
                }
            }
            return batch;
        } catch (error) {
            console.error("Error storing task:", error);
        }
    }

    const storeCompletedTask = async (taskRef, batch, imageURI, hidden) => {
        const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
        const postsRef = collection(FIRESTORE_DB, 'Posts');
        const postRef = doc(postsRef);

        try {
            batch.set(postRef, {
                userId: currentUser.uid,
                postName: newTask,
                description: newDescription,
                timePosted: new Date(),
                timeTaskCreated: new Date(),
                image: imageURI,
                completeByDate: selectedDate,
                isCompletionTime: isTime,
                priority: selectedPriority,
                reminders: selectedReminders,
                listIds: selectedLists,
                hidden: hidden,
                likeCount: 0,
                commentCount: 0,
            })
            let listRef;
            selectedLists.forEach((listId) => {
                listRef = doc(userProfileRef, 'Lists', listId);
                batch.update(listRef, { postIds: arrayUnion(postRef.id) });
            });
            let newCompleteByDate;
            if (selectedDate && (newCompleteByDate = isRepeatingTask(selectedDate.timestamp, dateRepeatEnds, selectedRepeat))) {
                batch = await storeIncompletedTask(true, taskRef, batch);
                batch.update(taskRef, { completeByDate: newCompleteByDate });
                if (selectedReminders.length !== 0) {
                    if (await configureNotifications()) {
                        const tempNotifIds = await scheduleNotifications(selectedReminders, newCompleteByDate, isTime, newTask);
                        batch.update(taskRef, { notificationIds: tempNotifIds });
                    }
                }
            }
            batch.update(userProfileRef, { posts: increment(1) });
            return batch;
        } catch (error) {
            console.error("Error storing post:", error);
        }
    }

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
        if (isCompleted) {
            let imageURI;
            let hidden = false;
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
                    hidden = true;
                    break;
                }
                else {
                    imageURI = null;
                    break;
                }
            }
            setCameraOptionModalVisible(false); //add loading screen here
            storeTask(imageURI, hidden);
        }
        else {
            storeTask(null, false);
        }
        setNewTask('');
        setNewDescription('');
        setCompleted(false);
        setSelectedLists([]);
        setSelectedDate(null);
        setSelectedPriority(0);
        setSelectedReminders([]);
        setSelectedRepeat(null);
        setIsTime(false);
        setDateRepeatEnds(null);
        setShowPriority(false);
        setHidden(false);
    };


    const checker = () => {
        isCompleted ? setCompleted(false) : setCompleted(true);
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
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            isTime={isTime}
                            setIsTime={setIsTime}
                            selectedReminders={selectedReminders}
                            setSelectedReminders={setSelectedReminders}
                            selectedRepeat={selectedRepeat}
                            setSelectedRepeat={setSelectedRepeat}
                            dateRepeatEnds={dateRepeatEnds}
                            setDateRepeatEnds={setDateRepeatEnds}
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
                                    {isCompleted ? (
                                        <CheckedTask width={32} height={32} />
                                    ) : (
                                        <UncheckedTask width={32} height={32} />
                                    )}
                                </TouchableOpacity>
                                <TextInput
                                    ref={textTaskInputRef}
                                    style={styles.inputTask}
                                    onChangeText={text => { setNewTask(text)}}
                                    value={newTask}
                                    placeholder={'Type your task here...'}
                                    placeholderTextColor={'#C7C7CD'}
                                    autoCorrect={false}
                                />
                            </View>
                            {newTask.length > 0 && <TouchableOpacity onPress={handleSubmitHelper}>
                                <Ionicons name={'arrow-up-circle'} size={28} color={colors.accent} />
                            </TouchableOpacity>}
                        </View>
                        <View style={styles.descriptionWrapper}>
                            <TextInput
                                style={styles.inputDescription}
                                onChangeText={text => setNewDescription(text)}
                                value={newDescription}
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
                                        color={selectedDate ? colors.accent : colors.primary}
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
                                        color={flagColor[selectedPriority]}
                                    />)
                                        : (<Feather name="x-circle" size={28} color={colors.primary} />)}
                                </View>
                            </TouchableOpacity>
                            {showPriority && (<View style={styles.priorityContainer}>
                                <TouchableOpacity onPress={() => { selectedPriority == 1 ? setSelectedPriority(0) : setSelectedPriority(1) }} style={[selectedPriority == 1 ? { width: 75, ...styles.selectedPriorityButton } : { width: 60 }, styles.priorityButtonLow]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[1]}
                                        />
                                        <Text style={styles.priorityText}>Low</Text>
                                        {selectedPriority == 1 && <Feather name="x" size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { selectedPriority == 2 ? setSelectedPriority(0) : setSelectedPriority(2) }} style={[selectedPriority == 2 ? { width: 80, ...styles.selectedPriorityButton } : { width: 65 }, styles.priorityButtonMed]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[2]}
                                        />
                                        <Text style={styles.priorityText}>Med</Text>
                                        {selectedPriority == 2 && <Feather name="x" size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { selectedPriority == 3 ? setSelectedPriority(0) : setSelectedPriority(3) }} style={[selectedPriority == 3 ? { width: 85, ...styles.selectedPriorityButton } : { width: 70 }, styles.priorityButtonHigh]}>
                                    <View style={styles.priorityButtonContainer}>
                                        <Icon
                                            name="flag"
                                            size={16}
                                            color={flagColor[3]}
                                        />
                                        <Text style={styles.priorityText}>High</Text>
                                        {selectedPriority == 3 && <Feather name="x" size={16} color={colors.primary} />}
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
    selectedPriorityButton: {
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