import { Text } from "react-native";
import { StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import { useState } from "react";
import { updateField } from '../utils/checkFieldFunctions';
import { StackActions } from '@react-navigation/native';
import colors from "../theme/colors";
import fonts from "../theme/fonts";


const EditFieldScreen = ({route, navigation}) => {
    const {user, fieldName, fieldInput, description, placeholder} = route.params;

    const [field, setField] = useState(fieldInput);
    const [error, setError] = useState(null);

    const handleUpdateField = async() => {
        try {
            let tempUser = user;
            if (fieldName == "Name") {
                await updateField({name: field});
                tempUser.name = field
            }
            else if (fieldName == "Username") {
                await updateField({username: field, username_lower: field.toLowerCase()});
                tempUser.username = field;
            }
            else {
                await updateField({bio: field});
                tempUser.bio = field;
            }
            navigation.dispatch(StackActions.popTo('EditProfile', {
                user: tempUser,
            }))
        } catch (e) {
            setError(e.message);
        }
    }

    const handleChangeText = (text) => {
        let maxLines = 1;
        let maxChars = 30
        if (fieldName == "Bio") {
            maxLines = 7;
            maxChars = 150;
        }
        const lines = text.split('\n').length;
        if (lines <= maxLines && text.length <= maxChars) {
            setField(text);
        } else {
            
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topContainer}>
                <TouchableOpacity style={{width: 50}} onPress={navigation.goBack}>
                    <Ionicons name='chevron-back' size={24} color='black'/>
                </TouchableOpacity>
                <View>
                    <Text style={styles.fieldName}>{fieldName}</Text>
                </View>
                <TouchableOpacity>
                    <Text onPress={handleUpdateField} style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.bottomContainer}>
                {error && <Text style={styles.error}>*{error}</Text>}
                <View style={styles.textInputContainer}>
                    <TextInput
                        style={styles.textInput}
                        onChangeText={text => handleChangeText(text)}
                        value={field}
                        placeholder={placeholder}
                        placeholderTextColor={'#C7C7CD'}
                        autoCorrect={false}
                        autoFocus={true}
                        multiline={fieldName == "Bio"}
                        autoCapitalize="none"
                    />
                </View>
                <Text style={styles.description}>{description}</Text>
            </View>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topContainer: {
        marginHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    fieldName: {
        fontFamily: fonts.bold,
        color: colors.primary,
        fontSize: 18,
    },
    saveText: {
        fontSize: 18,
        textAlign: 'center',
        fontFamily: fonts.bold,
        color: colors.link,
        width: 50,
    },
    bottomContainer: {
        margin: 5,
        flexDirection: 'column',
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 14,
        marginBottom: 5,
        color: colors.red,
        textAlign: 'left',
    },
    textInputContainer: {
        backgroundColor: colors.surface,
        minHeight: 40,
        borderRadius: 15,
        borderWidth: 1,
        justifyContent: 'center',
        borderColor: colors.primary,
        marginBottom: 5,
    },
    textInput: {
        padding: 5,
        fontFamily: fonts.regular,
        color: colors.primary,
        fontSize: 16,
    },
    description: {
        padding: 5,
        fontFamily: fonts.regular,
        color: colors.fade,
        fontSize: 14,
    },
})

export default EditFieldScreen;