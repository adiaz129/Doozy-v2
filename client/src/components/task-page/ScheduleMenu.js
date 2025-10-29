import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReminderModal from './PopUpMenus/ReminderModal';
import RepeatModal from './PopUpMenus/RepeatModal';
import TimePopupMenu from './PopUpMenus/TimePopupMenu';
import RepeatEndsModal from './PopUpMenus/RepeatEndsModal';
import { Calendar } from 'react-native-calendars';
import { Ionicons, Feather} from '@expo/vector-icons';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { dateToDayObj } from '../../utils/timeFunctions.js';

const ScheduleMenu = (props) => {

    const getTodayDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            timestamp: today.getTime(),
            dateString: today.toISOString().split('T')[0],
        };
    };
    const { setCalendarModalVisible, selectedDate, setSelectedDate, isTime, setIsTime, selectedReminders, setSelectedReminders, selectedRepeat, setSelectedRepeat, dateRepeatEnds, setDateRepeatEnds } = props;

    const [tempSelectedDate, setTempSelectedDate] = useState(!selectedDate ? getTodayDate() : dateToDayObj(selectedDate));
    const [tempTime, setTempTime] = useState(isTime ? selectedDate : new Date());
    const [tempSelectedReminders, setTempSelectedReminders] = useState(selectedReminders);
    const [tempSelectedRepeat, setTempSelectedRepeat] = useState(selectedRepeat);
    const [isDateRepeatEnds, setIsDateRepeatEnds] = useState(dateRepeatEnds ? true : false);
    const [tempDateRepeatEnds, setTempDateRepeatEnds] = useState(dateRepeatEnds ? dateRepeatEnds : new Date());
    const [reminderString, setReminderString] = useState("");
    const [repeatString, setRepeatString] = useState("");
    const [isTempTime, setIsTempTime] = useState(isTime);

    const [reminderButtonHeight, setReminderButtonHeight] = useState(null);
    const [repeatButtonHeight, setRepeatButtonHeight] = useState(null);
    const [timeButtonHeight, setTimeButtonHeight] = useState(null);
    const [repeatEndsButtonHeight, setRepeatEndsButtonHeight] = useState(null);
    const [isReminderMenuVisible, setIsReminderMenuVisible] = useState(false);
    const [isRepeatMenuVisible, setIsRepeatMenuVisible] = useState(false);
    const [isRepeatEndsModalVisible, setIsRepeatEndsModalVisible] = useState(false);
    const [isTimeMenuVisible, setIsTimeMenuVisible] = useState(false);

    const reminderMenuRef = useRef(null);
    const timeMenuRef = useRef(null);
    const repeatMenuRef = useRef(null);
    const repeatEndsRef = useRef(null);

    // modalHeight: 650
    // cancelDoneHeight: 40
    // calendarHeight: 360
    // menuHeight: 200
    // clearHeight: 20


    const handleDateSelect = (date) => {
        const localDate = new Date(date.year, date.month - 1, date.day);
        setTempSelectedDate({
            ...date,
            timestamp: localDate.getTime()
        });
        if (tempDateRepeatEnds < localDate.getTime()) {
            setTempDateRepeatEnds(localDate);
        }
    };

    const toggleReminderMenu = () => {
        if (reminderMenuRef.current) {
            reminderMenuRef.current.measure((x, y, width, height, pageX, pageY) => {
                setReminderButtonHeight(pageY);
            });
        }
        setIsReminderMenuVisible(!isReminderMenuVisible);

    };

    const toggleRepeatMenu = () => {
        if (repeatMenuRef.current) {
            repeatMenuRef.current.measure((x, y, width, height, pageX, pageY) => {
                setRepeatButtonHeight(pageY);
            });
        }
        setIsRepeatMenuVisible(!isRepeatMenuVisible);
    };

    const toggleRepeatEndsModal = () => {
        if (repeatEndsRef.current) {
            repeatEndsRef.current.measure((x, y, width, height, pageX, pageY) => {
                setRepeatEndsButtonHeight(pageY);
            });
        }
        setIsDateRepeatEnds(true);
        setIsRepeatEndsModalVisible(!isRepeatEndsModalVisible);
    };

    const showTimepicker = (currentTime, onChange) => {
    DateTimePickerAndroid.open({
        value: currentTime,
        onChange,
        mode: 'time',
        is24Hour: false, // or true as desired
    });
    };

    const toggleTimeMenu = () => {
        if (!isTempTime) {
            setTempTime(new Date());
        }
        if (timeMenuRef.current) {
            timeMenuRef.current.measure((x, y, width, height, pageX, pageY) => {
                setTimeButtonHeight(pageY);
            });
        }
        if (Platform.OS === 'ios') {
            setIsTimeMenuVisible(!isTimeMenuVisible);
        }
        else {
            showTimepicker(tempTime, handleTimeChange);
        }
        if (!isTempTime) {
            setIsTempTime(true);
            setTempSelectedReminders([0]);
        }
    };

    const handleTimeCancel = () => {
        setIsTempTime(false);
        setTempSelectedReminders([]);
    }

    const handleReminderCancel = () => {
        setTempSelectedReminders([]);
    }

    const handleRepeatCancel = () => {
        setTempSelectedRepeat(null);
        handleRepeatEndsCancel();
    }

    const handleRepeatEndsCancel = () => {
        setIsDateRepeatEnds(false);
        setTempDateRepeatEnds(new Date());
    }

    const handleTimeChange = (newTime) => {
        if (Platform.OS === 'android')  {
            setTempTime(new Date(newTime.nativeEvent.timestamp));
        }
        else {
           setTempTime(newTime); 
        }
        
    }

    const handleReminderStringChange = () => {
        changeReminderString();
    };

    const handleRepeatStringChange = () => {
        changeRepeatString();
    };

    // Call handleReminderStringChange after selectedReminders state is updated
    useEffect(() => {
        handleReminderStringChange();
    }, [tempSelectedReminders]);

    // Call handleReminderStringChange after selectedReminders state is updated
    useEffect(() => {
        handleRepeatStringChange();
    }, [tempSelectedRepeat]);

    const changeReminderString = () => {
        if (tempSelectedReminders.length === 0) {
            setReminderString("None");
        }
        else if (tempSelectedReminders.length === 1) {
            setReminderString(isTempTime ? reminderWithTime[tempSelectedReminders[0]].label : reminderNoTime[tempSelectedReminders[0]].label);
        }
        else {
            setReminderString(isTempTime ? reminderWithTime[tempSelectedReminders[0]].label + ", ..." : reminderNoTime[tempSelectedReminders[0]].label + ", ...");
        }
    }

    const changeRepeatString = () => {
        if (tempSelectedRepeat === null) {
            setRepeatString("None");
        } else if (repeat[tempSelectedRepeat] && repeat[tempSelectedRepeat].label) {
            setRepeatString(repeat[tempSelectedRepeat].label);
        } else {
            setRepeatString("None");
        }
    }

    const reminderNoTime = [
        { label: 'On the day (9:00 am)' },
        { label: '1 day early (9:00 am)' },
        { label: '2 day early (9:00 am)' },
        { label: '3 day early (9:00 am)' },
        { label: '1 week early (9:00 am)' }
    ];

    const reminderWithTime = [
        { label: 'On time' },
        { label: '5 minutes early' },
        { label: '30 minutes early' },
        { label: '1 hour early' },
        { label: '1 day early' }
    ];

    const repeat = [
        { label: 'Daily' },
        { label: 'Weekly' },
        { label: 'Monthly' },
        { label: 'Yearly' },
        { label: 'Every weekday' },
    ];

    const handleSaveChanges = () => {
        const date = new Date(tempSelectedDate.year, tempSelectedDate.month - 1, tempSelectedDate.day);
        const dateWithTime = new Date(tempSelectedDate.year, tempSelectedDate.month - 1, tempSelectedDate.day,
                             isTempTime ? tempTime.getHours() : 0,
                             isTempTime ? tempTime.getMinutes() : 0,
                             0, 0);

        tempSelectedDate.timestamp = dateWithTime.getTime();
        setSelectedDate(new Date(tempSelectedDate.timestamp));
        setIsTime(isTempTime);
        setSelectedReminders(tempSelectedReminders);
        setSelectedRepeat(tempSelectedRepeat);
        if (isDateRepeatEnds) {
            setDateRepeatEnds(tempDateRepeatEnds);
        }
        else {
            setDateRepeatEnds(null)
        }
        setCalendarModalVisible(false);
    }

    const clearData = () => {
        setSelectedDate(null);
        setIsTime(false);
        setSelectedReminders([]);
        setSelectedRepeat(null);
        setDateRepeatEnds(null);
        setCalendarModalVisible(false);
    }


    let hours = tempTime.getHours(); // Get the hours component (0-23)
    const minutes = tempTime.getMinutes(); // Get the minutes component (0-59)
    let period = 'AM'; // Default period is AM

    // Adjust hours to 12-hour format and determine AM/PM
    if (hours >= 12) {
        period = 'PM';
    }
    if (hours > 12) {
        hours -= 12;
    }

    // Handle midnight (0 hours) and noon (12 hours)
    if (hours === 0) {
        hours = 12;
    }

    // Format the hours and minutes to ensure they are always two digits (e.g., '01' instead of '1')
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    // Construct the time string in 'hh:mm AM/PM' format
    const timeString = `${formattedHours}:${formattedMinutes} ${period}`;

    const dateToString = (date) => {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const y = date.getFullYear();
        return `${m}/${d}/${y}`;
    }
    
    const getDateString = (timestamp) => {
        const date = new Date(timestamp)
        const formatted =
            (date.getMonth() + 1) + '/' +
            date.getDate() + '/' +
            date.getFullYear();
        return formatted;
    }

    const getTimeString = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.bigContainer}>
                <View style={{height: 50}}>
                    <View style={styles.saveChanges}>
                        <TouchableOpacity style={{width: 50}} onPress={() => setCalendarModalVisible(false)}>
                            <Ionicons name="chevron-down-outline" size={32} color="black" />
                        </TouchableOpacity>
                        <View style={styles.dueDateContainer}>
                            <Text style={styles.timePicker}>Due Date:</Text>
                        {isTempTime ? (
                            <Text style={styles.timePicker}>{getDateString(tempSelectedDate.timestamp)}, {getTimeString(tempTime)}</Text>
                        ) : (
                            <Text style={styles.timePicker}>{getDateString(tempSelectedDate.timestamp)}</Text>
                        )
                        }
                        </View>
                        <TouchableOpacity style={{width: 50}} onPress={handleSaveChanges} >
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{height: 380}}>
                    <Calendar
                        current={tempSelectedDate.dateString}
                        onDayPress={(day) => handleDateSelect(day)}
                        markedDates={{
                        [tempSelectedDate.dateString]: { selected: true }
                        }}
                        style={{borderRadius: 15}}
                        theme={{
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.secondary,
                            selectedDayTextColor: colors.button_text,
                            selectedDayBackgroundColor: colors.accent,
                            dayTextColor: colors.primary,
                            todayTextColor: colors.second_accent,
                            textDisabledColor: '#d9e1e8',
                            arrowColor: colors.accent,
                            monthTextColor: colors.primary,
                            textDayFontFamily: fonts.regular,
                            textMonthFontFamily: fonts.bold,
                            textDayHeaderFontFamily: fonts.regular,
                            textDayFontSize: 16,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 14,
                        }}
                    />
                </View>
                <View style={{height: 200}}>
                    <TouchableOpacity ref={timeMenuRef} onPress={toggleTimeMenu} style={[styles.menuButton, styles.menuTopButton]}>
                        <View style={styles.menuButtonWrapper}>
                            <Text style={styles.menuText}>Time</Text>
                            <View style={styles.cancelContainer}>
                                <Text style={styles.menuInputs}>{isTempTime ? timeString : 'None'}</Text>
                                {isTempTime && <TouchableOpacity style={{ marginLeft: 5}} onPress={handleTimeCancel}>
                                    <Feather name="x" size={20} color={colors.primary} />
                                </TouchableOpacity>}
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity ref={reminderMenuRef} onPress={toggleReminderMenu} style={styles.menuButton}>
                        <View style={styles.menuButtonWrapper}>
                            <Text style={styles.menuText}>Reminder</Text>
                            <View style={styles.cancelContainer}>
                                <Text style={styles.menuInputs}>{reminderString}</Text>
                                {(tempSelectedReminders.length !== 0) && <TouchableOpacity style={{ marginLeft: 5}} onPress={handleReminderCancel}>
                                    <Feather name="x" size={20} color={colors.primary} />
                                </TouchableOpacity>}
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity ref={repeatMenuRef} onPress={toggleRepeatMenu} style={[styles.menuButton, (tempSelectedRepeat === null) ? styles.menuBottomButton : null]}>
                        <View style={styles.menuButtonWrapper}>
                            <Text style={styles.menuText}>Repeat</Text>
                            <View style={styles.cancelContainer}>
                                <Text style={styles.menuInputs}>{repeatString}</Text>
                                {(tempSelectedRepeat !== null) && <TouchableOpacity style={{ marginLeft: 5}} onPress={handleRepeatCancel}>
                                    <Feather name="x" size={20} color={colors.primary} />
                                </TouchableOpacity>}
                            </View>
                        </View>
                    </TouchableOpacity>
                    {(tempSelectedRepeat !== null) && <TouchableOpacity ref={repeatEndsRef} onPress={toggleRepeatEndsModal} style={[styles.menuButton, styles.menuBottomButton]}>
                        <View style={styles.menuButtonWrapper}>
                            <Text style={styles.menuText}>Repeat Ends</Text>
                            <View style={styles.cancelContainer}>
                                <Text style={styles.menuInputs}>{!isDateRepeatEnds ? 'Never' : dateToString(tempDateRepeatEnds)}</Text>
                                {isDateRepeatEnds && <TouchableOpacity style={{ marginLeft: 5}} onPress={handleRepeatEndsCancel}>
                                    <Feather name="x" size={20} color={colors.primary} />
                                </TouchableOpacity>}
                            </View>
                        </View>
                    </TouchableOpacity>}
                </View>
            </View>
            <View style={styles.clearContainer}>
                <TouchableOpacity style={{height: 20, ...styles.smallContainer}} onPress={clearData}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>
            <TimePopupMenu isVisible={isTimeMenuVisible} onClose={toggleTimeMenu} time={tempTime} handleTimeChange={handleTimeChange} buttonHeight={timeButtonHeight} />
            <ReminderModal isVisible={isReminderMenuVisible} onClose={toggleReminderMenu} menuOptions={isTempTime ? reminderWithTime : reminderNoTime} selectedOptions={tempSelectedReminders} setSelectedOptions={setTempSelectedReminders} buttonHeight={reminderButtonHeight} />
            <RepeatModal isVisible={isRepeatMenuVisible} onClose={toggleRepeatMenu} menuOptions={repeat} selectedOption={tempSelectedRepeat} setSelectedOption={setTempSelectedRepeat} buttonHeight={repeatButtonHeight} />
            <RepeatEndsModal isVisible={isRepeatEndsModalVisible} setIsRepeatEndsModalVisible={setIsRepeatEndsModalVisible} dateRepeatEnds={tempDateRepeatEnds} setDateRepeatEnds={setTempDateRepeatEnds} minimumDate={new Date(tempSelectedDate.year, tempSelectedDate.month - 1, tempSelectedDate.day)} buttonHeight={repeatEndsButtonHeight} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
    },
    bigContainer: {
        
    },
    saveChanges: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'

    },
    dueDateContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timePicker: {
        textAlign: 'center',
        color: colors.primary,
        fontFamily: fonts.regular,
    },
    saveButton: {
        color: colors.link,
        fontFamily: fonts.bold,
        fontSize: 18,
    },
    menuTopButton: {
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    menuBottomButton: {
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    menuButton: {
        padding: 15,
        backgroundColor: colors.surface,
        height: 50
    },
    buttonReminder: {
        backgroundColor: '#cccccc',
        borderRadius: 5,
    },
    menuButtonWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuText: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.primary,
    },
    menuInputs: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.primary,
    },
    cancelContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    selectedReminders: {
        backgroundColor: "yellow",
    },
    listsMenu: {
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    clearContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearText: {
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.red,
        paddingHorizontal: 10,
    },
});

export default ScheduleMenu;