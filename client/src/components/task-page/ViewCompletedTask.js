import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Keyboard, TextInput, Dimensions, TouchableWithoutFeedback, Animated, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import CheckedTask from '../../assets/checked-task.svg';
import ConfirmationModal from '../ConfirmationModal';

const ViewCompletedTask = (props) => {
    const { task, listItems, toggleCompletedTaskVisible, index, completeTask, deleteItem} = props;

    const screenHeight = Dimensions.get('window').height;
    const defaultHeight = screenHeight * 0.5;
    const scheduleMenuHeight = 730;
    const maxHeight = screenHeight * 0.9;

    const animatedHeight = useRef(new Animated.Value(defaultHeight)).current;

    const flagColor = [colors.primary, colors.secondary, colors.accent, colors.red];
    const [isUncompleteTaskConfirmationVisible, setUncompleteTaskConfirmationVisible] = useState(false);
    const [isDeleteTaskModalVisible, setDeleteTaskModalVisible] = useState(false);


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


    const getDateString = (timestamp) => {
        console.log(timestamp)
        return timestamp.toLocaleDateString();
    }

    const getTimeString = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    const uncompleteTaskHelper = (index, complete) => {
        // if (!task.hidden) {
        //     setUncompleteTaskConfirmationVisible(true);
        // }
        // else {
        toggleCompletedTaskVisible();
        completeTask(index, complete);
        // }
    }

    return (
        <View style={{ flex: 1 }}>
            {/* <Modal
                visible={isUncompleteTaskConfirmationVisible}
                transparent={true}
                animationType='fade'
            >
                <ConfirmationModal
                    confirm={async()=>{ setUncompleteTaskConfirmationVisible(false); 
                        await new Promise(resolve => setTimeout(resolve, 500));
                        toggleCompletedTaskVisible();
                        await completeTask(index, true);
                    }}
                    deny={()=>{setUncompleteTaskConfirmationVisible(false);}}
                    cancel={() => {}}
                    title={"Delete post?"}
                    description={"This will delete the post associated with this task and will mark this task as incomplete."}
                    confirmText={"Delete"}
                    denyText={"Cancel"}
                    confirmColor={colors.red}
                    denyColor={colors.primary}
                />
            </ Modal> */}
            <Modal
                visible={isDeleteTaskModalVisible}
                transparent={true}
                animationType='fade'
            >
                <ConfirmationModal
                    confirm={async() => {
                        setDeleteTaskModalVisible(false);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        toggleCompletedTaskVisible()
                        await deleteItem(index, true); 
                    }}
                        
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
            <TouchableWithoutFeedback onPress={() => toggleCompletedTaskVisible()}>
                <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View style={[styles.modalContainer, { height: animatedHeight }]}>
                    <View style={styles.rowOneView}>
                        <TouchableOpacity onPress={() => toggleCompletedTaskVisible()} style={{ width: 50 }}>
                            <Ionicons name="chevron-down-outline" size={32} color={colors.primary} />
                        </TouchableOpacity>
                        {task && <View style={styles.listButton}>
                            <View style={{marginRight: 5}}>
                                <FontAwesome5 name="list-ul" size={16} color={colors.primary} />
                            </View>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.listPicker}>{task.lists.length === 0 ? "No Lists Selected" : listItems.find(item => item.list_id === task.lists[0]).list_name + (task.lists.length === 1 ? "" : ", ...")}</Text>
                        </View>}
                        <View style={{ width: 50, alignItems: 'center' }} />
                    </View>
                    <View style={styles.rowTwoView}>
                        {/* // change function */}
                        <TouchableOpacity onPress={() => {uncompleteTaskHelper(index, true)}} style={styles.checkedbox}>
                            <CheckedTask width={42} height={42} />
                        </TouchableOpacity>
                        {task && <View style={styles.dateContainer}>
                            <Text style={styles.timePicker}>Completed:</Text>
                            <Text style={[styles.timePickerTime, task.time_task_completed > task.complete_by_date ? {color: colors.red} : {color: colors.primary}]}>{getDateString(task.time_task_completed)}, {getTimeString(task.time_task_completed)}</Text>
                        </View>}
                        {task && <View style={{ marginLeft: 10, width: 24 }}>
                            <Icon
                                name="flag"
                                size={24}
                                color={flagColor[task.priority]}
                            />
                        </View>}
                    </View>
                    <ScrollView style={{paddingHorizontal: 20}}>
                        {task && <View style={styles.taskNameContainer}>
                            <Text style={styles.taskNameInput}>{task.task_name}</Text>
                        </View>}
                        {task && <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionInput}>{task.description}</Text>
                        </View>}
                    </ScrollView>
                    <View style={styles.trashContainer}>
                        <TouchableOpacity onPress={() => {setDeleteTaskModalVisible(true)}} style={styles.trashButton}>
                            <Ionicons name="trash-outline" size={32} color="red" />
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
        marginRight: 5
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
    timePickerTime: {
        textAlign: 'center',
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

export default ViewCompletedTask;
