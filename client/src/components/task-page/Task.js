import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import CheckedPost from '../../assets/checked-post-sent.svg';
import CheckedTask from '../../assets/checked-task.svg'
import UncheckedTask from '../../assets/unchecked-task.svg';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';


const Task = (props) => {

    const { text, tick, i, complete, deleteItem, onOpen, onClose, isFirst, isLast, isSelected, hidden, info} = props;

    const [isOpened, setIsOpened] = useState(false);
    const rowRef = useRef(null);

    const onSwipeOpen = () => {
        if (!isOpened) {
            setIsOpened(true);
            onOpen(rowRef);
        }
    };
    const onSwipeClose = () => {
        if (isOpened) {
            setIsOpened(false);
            onClose(rowRef);
        }
    };

    const checkoff = () => {
        tick(i, complete);
    };

    const deleteItemHelper = () => {
    rowRef.current?.close();
    setTimeout(() => {
        deleteItem(i, complete);
    }, 300);
    };

    const flagColor = [colors.primary, colors.secondary, colors.accent, colors.red];

    const infoHelper = () => {
        let priority;
        let dueDate;
        if (info[0] !== 0) {
            priority = (<View style={styles.priorityContainer}><Icon name="flag" size={10} color={flagColor[info[0]]} /></View>)
        }
        else {
            priority = null;
        }
        if (info[1]) {
            if (info[1][0] === '-') {
                dueDate = <Text style={[styles.infoDueDate, {color: colors.red}]}>{info[1].substring(1)}</Text>
            }
            else {
                dueDate = <Text style={[styles.infoDueDate, {color: colors.primary}]}>{info[1]}</Text>
            }
        }
        else {
            dueDate = null;
        }
        return <View style={styles.infoContainer}>
            {dueDate && dueDate}
            <View style={styles.priorityContainer}>
                {priority && priority}
            </View>
        </View>
    }

    const RightActions = ({ onPress }) => {

        return (
            <TouchableOpacity onPress={onPress}>
                <View style={styles.rightAction}>
                    <Ionicons name="trash-outline" size={24} color={colors.button_text} />
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <Swipeable
            ref={rowRef}
            renderRightActions={() => <RightActions onPress={deleteItemHelper} />}
            onSwipeableWillOpen={() => onSwipeOpen(rowRef)}
            onSwipeableWillClose={() => onSwipeClose(rowRef)}
            simultaneousHandlers={rowRef}
        >
            <View style={[styles.item, isFirst && styles.firstTask, isLast && styles.lastTask, isSelected ? styles.selectedItem : styles.nonselectedItem]}>
                <View style={styles.noInfo}>
                    <TouchableOpacity style={styles.checkedbox} key={i} onPress={checkoff}>
                        {complete ? (
                            hidden ? (
                            <CheckedTask width={32} height={32} />
                            ) : (
                            <CheckedPost width={32} height={32} />
                            )
                        ):(
                            <UncheckedTask width={32} height={32} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.itemText}>{text}</Text>
                </View>
                {info && infoHelper()}
            </View>
        </Swipeable>
    )
}

const styles = StyleSheet.create({
    item: {
        paddingLeft: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
    },
    noInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    firstTask: {
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
    },
    lastTask: {
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    selectedItem: {
        backgroundColor: colors.tint,
    },
    nonselectedItem: {
        backgroundColor: colors.surface,
    },
    checkedbox: {
        marginRight: 10,
    },
    itemText: {
        maxWidth: '80%',
        color: colors.primary,
        fontFamily: fonts.regular,
        fontSize: 14,
    },
    infoContainer: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    priorityContainer: {
        width: 15,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 2,
        paddingRight: 2,
    },
    infoDueDate: {
        fontFamily: fonts.regular,
        fontSize: 11,
        alignSelf: 'center',
    },
    rightAction: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: 60,
    },
});

export default Task;