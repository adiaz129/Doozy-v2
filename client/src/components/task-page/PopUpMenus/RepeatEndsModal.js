import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../../theme/colors';

const RepeatEndsModal = ({ isVisible, setIsRepeatEndsModalVisible, dateRepeatEnds, setDateRepeatEnds, minimumDate, buttonHeight }) => {

    const totalButtonHeight = Dimensions.get('window').height - ( buttonHeight);

    const onChange = (event, newDate) => {
        if (newDate !== undefined) {
            setDateRepeatEnds(newDate);
        }
    };
    
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsRepeatEndsModalVisible(false)}
    >
        <TouchableWithoutFeedback onPress={() => setIsRepeatEndsModalVisible(false)}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                    <View style={[styles.menu, { bottom: totalButtonHeight, right: 25 }]}>
                      <View style={styles.innerMenu}>
                        <DateTimePicker mode="date" value={dateRepeatEnds} onChange={onChange} display='spinner' minimumDate={minimumDate} style={{flex: 1}}/>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    elevation: 5,
    position: 'absolute',
    height: 150,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default RepeatEndsModal;