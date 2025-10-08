import React, { useRef, useState, useEffect } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback, TextInput, Animated, Keyboard, Dimensions, Image} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { arrayRemove, collection, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../../firebaseConfig";
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';


const ListSelect = (props) => {
    const {setOpenDrawer, listItems, listId, setListId, userProfile, navigation} = props;
    const allListItems = [{id: "0", name: 'Master List', taskNumber: userProfile ? userProfile.tasks : 0}, ...listItems]
    const [addListModalVisible, setAddListModalVisible] = useState(false);
    const [listName, setListName] = useState("");
    const [listMenuModalVisible, setListMenuModalVisible] = useState(false);
    const [currYPosition, setCurrYPosition] = useState(0);
    const [currList, setCurrList] = useState(null);
    const [edit, setEdit] = useState(false);

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const listMenuXPosition = screenWidth * .7 - 150;

    const currentUser = FIREBASE_AUTH.currentUser;
    const addListRef = useRef(null);
    const listItemRefs = useRef({})
    const inputHeight = 50;

    const animatedHeight = useRef(new Animated.Value(inputHeight)).current;
    
    useEffect(() => {
        const willShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
            Animated.timing(animatedHeight, {
                toValue: inputHeight + e.endCoordinates.height,
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

    const openModal = () => {
        setAddListModalVisible(true);
        setTimeout(() => {
            addListRef.current?.focus()
        }, 10);
    }

    const dismissModal = () => {
        setListName("");
        Keyboard.dismiss();
        setTimeout(() => {
            setAddListModalVisible(false);
        }, 10);
    }

    const addList = async () => {
        try {
            const listRef = doc(collection(FIRESTORE_DB, 'Users', currentUser.uid, 'Lists'));
            await setDoc(listRef, {name: listName, postIds: [], taskIds: [], timeListCreated: new Date()});
            dismissModal();
            setListId(listRef.id);
        } catch (error) {
            console.error("Error adding list:", error)
        }
    }

    const editList = async () => {
        try {
            const listRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'Lists', currList.id);
            await updateDoc(listRef, {name: listName});
            dismissModal();
            setEdit(false);
        } catch (error) {
            console.error("Error editing list:", error)
        }
    }

    const deleteList = async(list) => {
        try {
            const batch = writeBatch(FIRESTORE_DB);
            let taskRef;
            let postRef;
            const listRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'Lists', list.id);
            list.taskIds.forEach((taskId) => {
                taskRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'Tasks', taskId);
                batch.update(taskRef, {listIds: arrayRemove(list.id)});
            })
            list.postIds.forEach((postId) => {
                postRef = doc(FIRESTORE_DB, 'Posts', postId);
                batch.update(postRef, {listIds: arrayRemove(list.id)});
            })
            batch.delete(listRef);
            await batch.commit();
            setListMenuModalVisible(false);
            setCurrList(null)
            if (listId == list.id) {
                setListId("0");
            }
        } catch (error) {
            console.error("Error deleting list:", error);
        }
    }

    const toggleListMenu = (item) => {
        listItemRefs.current[item.id]?.measure((x, y, width, height, pageX, pageY) => {
            setCurrYPosition(pageY);
        });
        setListMenuModalVisible(true);
        setCurrList(item);
    };
    
    const renderList = ({ item }) => (
        <TouchableOpacity ref={ref => {
            if (ref) {
                listItemRefs.current[item.id] = ref;
            } else {
                delete listItemRefs.current[item.id];
            }}}
            onPress={() => {setOpenDrawer(false); setListId(item.id)}} 
            style={{...(item.id == listId ? styles.listContainerSelected : {}), ...styles.listContainer}}
        >
            <View style={styles.nameContainer}>
                <Ionicons name="list-outline" size={18} color={colors.primary} />
                <Text style={styles.listName}>{item.name}</Text>
            </View>
            {item.id == '0' ? 
                (<Text style={styles.taskNumber}>{item.taskNumber}</Text>) 
            : (
                <TouchableOpacity onPress={() => toggleListMenu(item)} style={{ height: 50, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 10, alignItems: 'center' }}>
                    {currList && currList.id === item.id ?
                        (currYPosition * 2 > screenHeight ? 
                            (<Ionicons name="chevron-up-outline" size={18} color={colors.primary} />)
                        :
                            (<Ionicons name="chevron-down-outline" size={18} color={colors.primary} />))
                        : 
                        (<Ionicons name="ellipsis-vertical-outline" size={18} color={colors.primary} />)

                    }
                    
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Modal
                visible={addListModalVisible}
                transparent={true}
                animationType='slide'
            >
                <TouchableWithoutFeedback onPress={dismissModal}> 
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <Animated.View style={{height: animatedHeight, ...styles.addListContainer}}>
                    <View style={styles.inputContainer}>
                        <TextInput 
                            ref={addListRef} 
                            placeholder={"Enter list name..."}
                            placeholderTextColor={'#C7C7CD'}
                            style={styles.addListInput} 
                            value={listName} 
                            onChangeText={text => {setListName(text);}} 
                        />
                        {listName.length > 0 && <TouchableOpacity onPress={edit ? editList : addList} style={styles.saveListButton}>
                            <Ionicons name="add-circle-outline" size={32} color={colors.primary}/>
                        </TouchableOpacity>}
                    </View>
                </Animated.View>
            </Modal>
            <Modal
                visible={listMenuModalVisible}
                transparent={true}
                animationType='fade'
            >
                <TouchableWithoutFeedback onPress={() => {setCurrList(null); setListMenuModalVisible(false);}}>
                    <View style={styles.listMenuBackground}>
                        <TouchableWithoutFeedback>
                            <View style={[currYPosition * 2 > screenHeight ? {top: currYPosition - 70} : {top: currYPosition + 40}, {left: listMenuXPosition}, styles.listMenu]}>
                                <TouchableOpacity onPress={() => {setEdit(true); setListName(currList.name); setListMenuModalVisible(false); openModal(); setCurrList(null);}}style={styles.listMenuButtons}>
                                    <Text style={styles.listMenuText}>Rename</Text>
                                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteList(currList)} style={styles.listMenuButtons}>
                                    <Text style={styles.listMenuText}>Delete</Text>
                                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <View style={styles.listSelectBar}>
                <Text style={styles.listSelectText}>List Select</Text>
            </View>
            <FlatList 
                data={allListItems}
                renderItem={renderList}
                keyExtractor={item => item.id}
            />
            <TouchableOpacity onPress={openModal} style={styles.addListButton}>
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                <Text style={styles.addListText}>Add List</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    listSelectBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    listSelectText: {
        fontSize: 18,
        fontFamily: fonts.bold,
    },
    addListButton: {
        alignSelf: 'center',
        margin: 20,
        flexDirection: 'row',
        alignItems: 'center',
        bottom: 80,
    },
    addListText: {
        fontSize: 18,
        marginLeft: 5,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    addListContainer: {
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        backgroundColor: colors.surface,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addListInput: {
        fontSize: 18,
        height: 50,
        paddingHorizontal: 15,
        fontFamily: fonts.regular,
        color: colors.primary,
        width: '85%',
    },
    saveListButton: {
        marginRight: 10,
    },
    listMenuBackground: {
        flex: 1,
    },
    listMenu: {
        height: 80,
        backgroundColor: colors.surface,
        width: 150,
        borderRadius: 15,
        flexDirection: 'column',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    listMenuButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: '50%',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    listMenuText: {
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    listContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        height: 50,
        width: '100%'
    },
    listContainerSelected: {
        backgroundColor: colors.tint,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        height: 50,
    },
    listName: {
        paddingLeft: 10,
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    taskNumber: {
        width: 40,
        marginRight: 10,
        color: colors.primary,
        fontFamily: fonts.regular,
        textAlign: 'right'
    },
})

export default ListSelect;