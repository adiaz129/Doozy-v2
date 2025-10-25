import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Keyboard, TextInput, Dimensions, TouchableWithoutFeedback, Animated, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import ScheduleMenu from './ScheduleMenu';
import ListModal from './PopUpMenus/ListModal';
import { Ionicons,FontAwesome5 } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FIREBASE_AUTH, FIRESTORE_DB, uploadToFirebase } from '../../../firebaseConfig';
import { writeBatch, doc, collection, increment, arrayRemove, arrayUnion } from 'firebase/firestore';
import { addImage, takePhoto } from '../../utils/photoFunctions';
import CameraOptionMenu from './PopUpMenus/CameraOptionMenu';
import ConfirmationModal from '../ConfirmationModal';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import UncheckedTask from '../../assets/unchecked-task.svg';
import CheckedTask from '../../assets/checked-task.svg';
import axios from 'axios';

const EditTask = (props) => {
    const { task, setTaskItems, index, listItems, toggleEditTaskVisible, configureNotifications, scheduleNotifications, cancelNotifications, isRepeatingTask, deleteItem } = props;

    const priorityRef = useRef(null);

    const [editedTaskName, setEditedTaskName] = useState(task ? task.task_name : null);
    const [editedDescription, setEditedDescription] = useState(task ? task.description : null);
    const [isComplete, setComplete] = useState(false);

    const [priorityYPosition, setPriorityYPosition] = useState(0);
    
    const [isSaveChangesModalVisible, setSaveChangesModalVisible] = useState(false);
    const [isDeleteTaskModalVisible, setDeleteTaskModalVisible] = useState(false);
    const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);
    const [isListModalVisible, setListModalVisible] = useState(false);
    const [isPriorityModalVisible, setPriorityModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(task ? task.complete_by_date : null);
    const [isTime, setIsTime] = useState(task ? task.is_completion_time : null);
    const [selectedReminders, setSelectedReminders] = useState(task ? task.reminders : null);
    const [selectedRepeat, setSelectedRepeat] = useState(task ? task.repeat_interval : null)
    const [dateRepeatEnds, setDateRepeatEnds] = useState(task ? task.repeat_ends : null);
    const [selectedPriority, setSelectedPriority] = useState(task ? task.priority : null);
    const [selectedLists, setSelectedLists] = useState(task ? task.lists : null)

    const [cameraOptionModalVisible, setCameraOptionModalVisible] = useState(false);
    const [resolver, setResolver] = useState(null);
    const [emptyTaskName, setEmptyTaskName] = useState(false);

    const textTaskInputRef = useRef(null);

    const screenHeight = Dimensions.get('window').height;
    const defaultHeight = screenHeight * 0.5;
    const scheduleMenuHeight = 730;
    const maxHeight = screenHeight * 0.9;

    const animatedHeight = useRef(new Animated.Value(defaultHeight)).current;

    const flagColor = [colors.primary, colors.secondary, colors.accent, colors.red];

    useEffect(() => {
        const willShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
            Animated.timing(animatedHeight, {
                toValue: Math.min(defaultHeight + e.endCoordinates.height, maxHeight),
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });

        const willHideSub = Keyboard.addListener('keyboardWillHide', (e) => {
            Animated.timing(animatedHeight, {
                toValue: defaultHeight,
                duration: e.duration,
                useNativeDriver: false
            }).start();
        });

        return () => {
            willShowSub.remove();
            willHideSub.remove();
        };
    }, []);

    const saveChanges = async () => {
        if (editedTaskName.length === 0) {
            setEmptyTaskName(true);
            textTaskInputRef.current.focus();
            return;
        }
        setSaveChangesModalVisible(false);
        try {
            let tempNotifIds = [];
            let response;
            if (!isComplete) {
                if (selectedReminders.length !== 0) {
                    if (await configureNotifications()) {
                        tempNotifIds = await scheduleNotifications(selectedReminders, selectedDate, isTime, editedTaskName);
                    }
                }
                response = await axios.patch(`http://localhost:8800/api/tasks/${task.task_id}`, {
                    task_name: editedTaskName,
                    description: editedDescription,
                    complete_by_date: selectedDate ? new Date(selectedDate).toISOString().slice(0, 19).replace('T', ' ') : null,
                    is_completion_time: isTime,
                    priority: selectedPriority,
                    reminders: selectedReminders,
                    repeat_interval: selectedRepeat,
                    repeat_ends: dateRepeatEnds ? new Date(dateRepeatEnds).toISOString().slice(0, 19).replace('T', ' ') : null,
                    lists: selectedLists,
                    notifications: tempNotifIds,
                    is_completed: false,
                });
            }
            else {
                setSaveChangesModalVisible(false);

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
                if (selectedDate && (newCompleteByDate = isRepeatingTask(selectedDate, dateRepeatEnds, selectedRepeat))) {// check if task repeats and return next possible date
                    if (selectedReminders.length !== 0) { // schedule notifications
                        if (await configureNotifications()) {
                            tempNotifIds = await scheduleNotifications(selectedReminders, newCompleteByDate, isTime, editedTaskName);
                        }
                    }
                }

                response = await axios.patch(`http://localhost:8800/api/tasks/${task.task_id}`, {
                    completing: true,
                    task_name: editedTaskName,
                    description: editedDescription,
                    complete_by_date: selectedDate ? new Date(selectedDate).toISOString().slice(0, 19).replace('T', ' ') : null,
                    is_completion_time: isTime,
                    priority: selectedPriority,
                    reminders: selectedReminders,
                    repeat_interval: selectedRepeat,
                    repeat_ends: dateRepeatEnds ? new Date(dateRepeatEnds).toISOString().slice(0, 19).replace('T', ' ') : null,
                    lists: selectedLists,
                    post: post,
                    image: imageURI,
                    new_complete_by_date: newCompleteByDate ? new Date(newCompleteByDate).toISOString().slice(0, 19).replace('T', ' ') : 0,
                    new_notifications: tempNotifIds,
                    is_completed: true,
                });
            }
            if (response.data.success) {
                console.log(response.data.message);
                await cancelNotifications(task.notifications);
            }
            setTimeout(() => {
                toggleEditTaskVisible()
            }, 100);
        } catch (error) {
            console.error("Error posting post:", error);
        }
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

    const getDateString = (timestamp) => {
        return timestamp.toLocaleDateString();
    }

    const getTimeString = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    const openPriorityModal = () => { // set a timeout
        Keyboard.dismiss();
        priorityRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setPriorityYPosition(pageY);
        });
        setPriorityModalVisible(true);
    }

    const discardChangesConfirmation = () => {
        if (task &&
            task.task_name !== editedTaskName ||
            task.description !== editedDescription ||
            isComplete ||
            task.complete_by_date !== selectedDate ||
            task.is_completion_time !== isTime || 
            task.reminders !== selectedReminders ||
            task.repeat_interval !== selectedRepeat ||
            task.repeat_ends !== dateRepeatEnds ||
            task.priority !== selectedPriority || 
            task.lists !== selectedLists
        ) {
            setSaveChangesModalVisible(true);
        }
        else {
            toggleEditTaskVisible();
        }

    }

    return (
        <View style={{ flex: 1 }}>
            <Modal
                visible={isSaveChangesModalVisible}
                transparent={true}
                animationType='fade'
            >
                <ConfirmationModal
                    confirm={()=>{saveChanges();}}
                    deny={()=>{setSaveChangesModalVisible(false);
                        setTimeout(() => {
                            toggleEditTaskVisible()
                        }, 100);}}
                    cancel={() => {}}
                    title={"Save Changes?"}
                    description={"You have unsaved changes. Do you want to save before leaving?"}
                    confirmText={"Save"}
                    denyText={"Discard"}
                    confirmColor={colors.link}
                    denyColor={colors.red}
                />
            </ Modal>
            <Modal
                visible={isDeleteTaskModalVisible}
                transparent={true}
                animationType='fade'
            >
                <ConfirmationModal
                    confirm={async() => {
                        await deleteItem(index, false); 
                        setDeleteTaskModalVisible(false);
                        setTimeout(() => {
                            toggleEditTaskVisible()
                        }, 100);}}
                    deny={()=>{setDeleteTaskModalVisible(false);}}
                    cancel={() => {}}
                    title={"Delete Task?"}
                    description={"This action cannot be undone."}
                    confirmText={"Delete"}
                    denyText={"Cancel"}
                    confirmColor={colors.red}
                    denyColor={colors.primary}
                />
            </ Modal>
            <Modal
                visible={isCalendarModalVisible}
                transparent={true}
                animationType="slide"
            >
                <TouchableWithoutFeedback onPress={() => setCalendarModalVisible(false)}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <View style={[{ height: scheduleMenuHeight}, styles.scheduleMenuContainer] }>
                    <ScheduleMenu
                        isCalendarModalVisible={isCalendarModalVisible}
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
                <TouchableWithoutFeedback onPress={() => setListModalVisible(false)}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <ListModal
                    selectedLists={selectedLists}
                    setSelectedLists={setSelectedLists}
                    listItems={listItems}
                    setListModalVisible={setListModalVisible}
                />
            </Modal>
            <Modal
                visible={isPriorityModalVisible}
                transparent={true}
                animationType='fade'
            >
                <TouchableWithoutFeedback onPress={() => setPriorityModalVisible(false)}>
                    <View style={styles.priorityContainer}>
                        <TouchableWithoutFeedback>
                            <View style={{ top: priorityYPosition + 30, ...styles.priorityButtonContainer }}>
                                <View style={{overflow: 'hidden', borderRadius: 15}}>
                                <TouchableOpacity onPress={() => { setSelectedPriority(0) }} style={[selectedPriority == 0 ? styles.selectedPriorityButton : {}, styles.priorityButtons]}>
                                    <Text style={styles.priorityText}>No Priority</Text>
                                    <Icon name="flag" size={16} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setSelectedPriority(1) }} style={[selectedPriority == 1 ? styles.selectedPriorityButton : {}, styles.priorityButtons]}>
                                    <Text style={styles.priorityText}>Low Priority</Text>
                                    <Icon name="flag" size={16} color={colors.secondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setSelectedPriority(2) }} style={[selectedPriority == 2 ? styles.selectedPriorityButton : {}, styles.priorityButtons]}>
                                    <Text style={styles.priorityText}>Medium Priority</Text>
                                    <Icon name="flag" size={16} color={colors.accent} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setSelectedPriority(3) }} style={[selectedPriority == 3 ? styles.selectedPriorityButton : {}, styles.priorityButtons]}>
                                    <Text style={styles.priorityText}>High Priority</Text>
                                    <Icon name="flag" size={16} color={colors.red} />
                                </TouchableOpacity>
                                </View>
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
                <TouchableWithoutFeedback onPress={() => { handleCameraOptionSelect("cancel"); setCameraOptionModalVisible(false); }}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <CameraOptionMenu
                    onChoose={handleCameraOptionSelect}
                />
            </Modal>
            <TouchableWithoutFeedback onPress={() => discardChangesConfirmation()}>
                <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View style={[styles.modalContainer, { height: animatedHeight }]}>
                    <View style={styles.rowOneView}>
                        <TouchableOpacity onPress={() => discardChangesConfirmation()} style={{ width: 50 }}>
                            <Ionicons name="chevron-down-outline" size={32} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setListModalVisible(true)} style={styles.listButton}>
                            <View style={{marginRight: 5}}>
                                <FontAwesome5 name="list-ul" size={16} color={colors.primary} />
                            </View>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.listPicker}>{selectedLists.length == 0 ? "No Lists Selected" : listItems.find(item => item.list_id == selectedLists[0]).list_name + (selectedLists.length == 1 ? "" : ", ...")}</Text>
                            <Ionicons name="chevron-down-outline" size={18} color={colors.primary}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ width: 50, alignItems: 'center' }} onPress={() => saveChanges()}>
                            {isComplete ? (<Text style={styles.save}>Post</Text>) : (<Text style={styles.save}>Save</Text>)}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.rowTwoView}>
                        <TouchableOpacity onPress={() => setComplete(!isComplete)} style={styles.checkedbox}>
                            {isComplete ? (
                                <CheckedTask width={42} height={42} />
                            ) : (
                                <UncheckedTask width={42} height={42} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateContainer} onPress={() => { setCalendarModalVisible(true) }}>
                            <Text style={styles.timePicker}>Due Date:</Text>
                            {isTime ? (
                                <Text style={styles.timePicker}>{getDateString(selectedDate)}, {getTimeString(selectedDate)}</Text>
                            ) : selectedDate ? (
                                <Text style={styles.timePicker}>{getDateString(selectedDate)}</Text>
                            ) : (
                                <Text style={styles.timePicker}>No time set</Text>
                            )
                            }
                        </TouchableOpacity>
                        <TouchableOpacity ref={priorityRef} onPress={openPriorityModal} style={{ marginLeft: 10, width: 24 }}>
                            <Icon
                                name="flag"
                                size={24}
                                color={flagColor[selectedPriority]}
                            />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{paddingHorizontal: 20}}>
                        <View style={styles.taskNameContainer}>
                            <TextInput
                                ref={textTaskInputRef}
                                onChangeText={text => {setEditedTaskName(text); setEmptyTaskName(false)}}
                                value={editedTaskName}
                                placeholder={emptyTaskName ? "*Task name required..." : "Task Name..."}
                                placeholderTextColor={emptyTaskName ? '#B86566' : '#C7C7CD'}
                                style={styles.taskNameInput}
                            />
                        </View>
                        <View style={styles.descriptionContainer}>
                            <TextInput
                                onChangeText={text => setEditedDescription(text)}
                                value={editedDescription}
                                placeholder="Description..."
                                placeholderTextColor={'#C7C7CD'}
                                style={styles.descriptionInput}
                            />
                        </View>
                    </ScrollView>
                    <View style={styles.trashContainer}>
                        <TouchableOpacity onPress={() => {setDeleteTaskModalVisible(true)}} style={styles.trashButton}>
                            <Ionicons name="trash-outline" size={32} color={colors.red} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    scheduleMenuContainer: {
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
    priorityContainer: {
        flex: 1,
    },
    priorityButtonContainer: {
        height: 160,
        backgroundColor: colors.surface,
        width: 160,
        borderRadius: 15,
        flexDirection: 'column',
        justifyContent: 'space-around',
        right: 20,
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4
    },
    selectedPriorityButton: {
        backgroundColor: colors.tint,
    },
    priorityButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 40,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    priorityText: {
        color: colors.primary,
        fontFamily: fonts.regular
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
    },
    rowOneView: {
        paddingHorizontal: 20,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listButton: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 200
    },
    save: {
        fontSize: 18,
        color: colors.link,
        fontFamily: fonts.bold,
    },
    listPicker: {
        textAlign: 'center',
        fontSize: 18,
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    rowTwoView: {
        height: 40,
        paddingRight: 20,
        paddingLeft: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'column',
        alignItems: 'center'
    },
    timePicker: {
        textAlign: 'center',
        color: colors.primary,
        fontFamily: fonts.regular,
    },
    taskNameContainer: {
        marginTop: 15,
        marginBottom: 10,
    },
    taskNameInput: {
        fontSize: 24,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    descriptionContainer: {
        marginTop: 10,
    },
    descriptionInput: {
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    taskText: {
        fontSize: 16
    },
    trashContainer: {
        marginBottom: 30,
    },
    trashButton: {
        alignSelf: 'center',
        width: 30,
    },
});

export default EditTask;
