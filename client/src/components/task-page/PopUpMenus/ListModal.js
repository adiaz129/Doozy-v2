import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Keyboard, Dimensions, FlatList, Animated, TextInput, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../../theme/colors';
import fonts from '../../../theme/fonts';

const ListModal = (props) => {

  const { selectedLists, setSelectedLists, listItems, setListModalVisible } = props;

  const currentUser = FIREBASE_AUTH.currentUser;

  const [showAddList, setShowAddList] = useState(false);
  const [listInputText, setListInputText] = useState("");
  const addListInputRef = useRef(null);

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.55;
  const maxHeight = screenHeight * 0.9;

  const [flatListHeight, setFlatListHeight] = useState(modalHeight - 130)

  const animatedHeight = useRef(new Animated.Value(modalHeight)).current;

  useEffect(() => {
    const willShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
      setFlatListHeight(maxHeight - e.endCoordinates.height - 100);
      Animated.timing(animatedHeight, {
        toValue: maxHeight,
        duration: e.duration,
        useNativeDriver: false
      }).start();
    });

    const willHideSub = Keyboard.addListener('keyboardWillHide', (e) => {
      setShowAddList(false);
      setFlatListHeight(modalHeight - 130);
      Animated.timing(animatedHeight, {
        toValue: modalHeight,
        duration: e.duration,
        useNativeDriver: false
      }).start();
    });

    return () => {
      willShowSub.remove();
      willHideSub.remove();
    };
  }, []);

  const handleListPress = (currId) => {
    if (selectedLists.includes(currId)) {
      let filteredList = selectedLists.filter(id => id !== currId);
      setSelectedLists(filteredList);
    }
    else {
      setSelectedLists([...selectedLists, currId]);
    }
  }

  const handleAddListPress = () => {
    setShowAddList(true);
  }

  const addList = async() => {
    try {
      const listRef = doc(collection(FIRESTORE_DB, 'Users', currentUser.uid, 'Lists'));
      await setDoc(listRef, {name: listInputText, taskIds: [], postIds: [], timeListCreated: new Date()});
      setSelectedLists([...selectedLists, listRef.id]);
      setListInputText("");
      setShowAddList(false);
    } catch (error){
      console.error("Error creating list:", error);
    }
  }

  const clear = () => {
    setSelectedLists([]);
  }

  const renderList = ( item, isLast ) => (
    <TouchableOpacity onPress={() => { handleListPress(item.id) }} style={{ ...(isLast ? {marginBottom: 20} : {}) , ...(selectedLists.includes(item.id) ? styles.listContainerSelected : {}), ...styles.listContainer }}>
      <View style={styles.nameContainer}>
        <Ionicons name="list-outline" size={18} color={selectedLists.includes(item.id) ? (colors.accent) : (colors.primary)} />
        <Text style={[selectedLists.includes(item.id) ? {color: colors.accent} : {color: colors.primary}, styles.listName]}>{item.name}</Text>
      </View>
      {selectedLists.includes(item.id) && (<View>
          <FontAwesome6 name={'check'} size={20} color={colors.accent} />
      </View>)}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ height: animatedHeight, backgroundColor: colors.surface, ...styles.container }}>
      <View style={styles.topContainer}>
        <View style={styles.rowOneView}>
          <TouchableOpacity onPress={() => setListModalVisible(false)} style={{ width: 45 }}>
            <Ionicons name="chevron-down-outline" size={32} color={colors.primary} />
          </TouchableOpacity>
          {selectedLists.length !== 0 && <View style={styles.listSelectedContainer}>
            <Text numberOfLines={1} style={styles.listText}>{listItems.filter(listItem => selectedLists.includes(listItem.id))[0].name}</Text>
            <Text numberOfLines={1} style={styles.listText}>{selectedLists.length > 1 && ` + ${selectedLists.length - 1} more`}</Text>
          </View>}
          {selectedLists.length > 0 && <TouchableOpacity style={{width: 50}} onPress={() => clear()}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>}
        </View>
          <View style={{ height: flatListHeight, ...styles.flatList }}>
            <FlatList
              data={listItems}
              renderItem={({ item, index }) => {
                const isLast = index === listItems.length - 1;
                return (renderList(item, isLast));
              }}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={true}
            />
            
            <LinearGradient //FIX FADE AT BOTTOM
              colors={[
                'rgba(255,255,255,0)',   // Fully transparent
                'rgba(255,255,255,0.7)', // Soft fade
                'rgba(255,255,255,1)',   // Solid white
              ]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 48, // Try 40-60 for a softer look
                pointerEvents: 'none',
              }}
            />
          </View>
        {showAddList && (<View style={{height: animatedHeight-modalHeight +50, ...styles.addListInputContainer}}>
          <TextInput
            ref={addListInputRef}
            onChangeText={text => {setListInputText(text);}}
            value={listInputText}
            placeholder={"Enter list name..."}
            placeholderTextColor={'#C7C7CD'}
            style={styles.addListInput}
            autoFocus={true}
          />
          {listInputText.length > 0 && <TouchableOpacity onPress={addList} style={styles.saveListButton}>
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          </TouchableOpacity>}
        </View>)}
      </View>
      
        {!showAddList && (<TouchableOpacity onPress={handleAddListPress} style={styles.addListButton}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          <Text style={styles.addListText}>Add List</Text>
        </TouchableOpacity>)}
    </Animated.View>
  );
};

export default ListModal;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  rowOneView: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15
  },
  listSelectedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '40%',
  },
  listText: {
    fontFamily: fonts.regular,
    color: colors.primary,
    fontSize: 14,
  },
  clear: {
    fontSize: 18,
    color: colors.red,
    fontFamily: fonts.bold,
    height: '50%'
  },
  topContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  flatList: {
  },
  addListInputContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
    },
  addListInput: {
    fontSize: 18,
    paddingHorizontal: 15,
    fontFamily: fonts.regular,
    color: colors.primary,
    width: '85%',
  },
  saveListButton: {
    marginRight: 10,
  },
  addListButton: {
    alignSelf: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    margin: 15,
  },
  addListText: {
    fontSize: 18,
    marginLeft: 5,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  listContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    height: 50,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listName: {
    paddingLeft: 10,
    fontSize: 18,
    maxWidth: '90%',
    textAlign: 'center',
    alignSelf: 'center',
    height: 24,
    fontFamily: fonts.regular,
  },
  taskNumber: {

  },
});