import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../../theme/colors';

const TimePopupMenu = ({ isVisible, onClose, time, handleTimeChange, buttonHeight }) => {

    const totalButtonHeight = Dimensions.get('window').height - ( buttonHeight);

    const onChange = (event, newTime) => {
        if (newTime !== undefined) {
            handleTimeChange(newTime);
        }
    };
    
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                    <View style={[styles.menu, { bottom: totalButtonHeight, right: 25,}]}>
                      <View style={styles.innerMenu}>
                        <DateTimePicker themeVariant="light" mode="time" value={time} onChange={onChange} display='spinner' style={{flex: 1}}/>
                      </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    position: 'absolute',
    height: 150,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  innerMenu:{
    overflow: 'hidden',
    borderRadius: 15,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOption: {
    fontSize: 16,
    paddingVertical: 10,
    color: 'white',
  },
  closeButton: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
    color: 'blue',
    marginTop: 10,
  },
  selectedReminders: {
    backgroundColor: "yellow",
},
priorityWrapper: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: 2,
},
});

export default TimePopupMenu;