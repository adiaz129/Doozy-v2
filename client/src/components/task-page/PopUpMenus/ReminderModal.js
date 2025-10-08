import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import colors from '../../../theme/colors';
import fonts from '../../../theme/fonts';
import { FontAwesome6 } from '@expo/vector-icons';

const ReminderModal = ({ isVisible, onClose, menuOptions, selectedOptions, setSelectedOptions, buttonHeight }) => {

    const totalButtonHeight = Dimensions.get('window').height - buttonHeight;

    const handleOptionSelect = (index) => {
      // Toggle selection state of the option
      if (selectedOptions.includes(index)) {
          setSelectedOptions(selectedOptions.filter((item) => item !== index));
      } else {
          setSelectedOptions([...selectedOptions, index]);
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
                    <View style={[styles.menu, { bottom: totalButtonHeight, right: 25}]}>
                        {menuOptions.map((option, index) => (
                        <TouchableOpacity key={index} onPress={() => handleOptionSelect(index)}>
                            <View style={styles.priorityWrapper}>
                                <Text style={[selectedOptions.includes(index) ? {color: colors.accent} : {color: colors.primary}, styles.menuOption]}>{option.label}</Text>
                                {selectedOptions.includes(index) && <View> 
                                  <FontAwesome6 name={'check'} size={16} color={colors.accent} />
                                </View>}
                            </View>
                        </TouchableOpacity>))}
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
    paddingHorizontal: 10,
    borderRadius: 10,
    elevation: 5,
    position: 'absolute',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  menuOption: {
    fontSize: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
  },
priorityWrapper: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: 2,
    justifyContent: 'space-between'
},
});

export default ReminderModal;