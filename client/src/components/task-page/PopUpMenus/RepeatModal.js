import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import colors from '../../../theme/colors';
import fonts from '../../../theme/fonts';
import { FontAwesome6 } from '@expo/vector-icons';

const RepeatModal = ({ isVisible, onClose, menuOptions, selectedOption, setSelectedOption, buttonHeight }) => {

    const totalButtonHeight = Dimensions.get('window').height - buttonHeight;

    const handleOptionSelect = (index) => {
        if (selectedOption === index) {
            setSelectedOption(null);
        }
        else {
            setSelectedOption(index)
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
                                <Text style={[selectedOption === index ? {color: colors.accent} : {color: colors.primary}, styles.menuOption]}>{option.label}</Text>
                                {selectedOption === index && <View> 
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
    backgroundColor: 'rgba(0, 0, 0, 0)',
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
  selectedOptions: {
},
priorityWrapper: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
},
});

export default RepeatModal;