import { StyleSheet, TextInput, Text, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import UploadImage from '../components/profile/profilePic';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const EditProfileScreen = ({route, navigation}) => {

    const {user} = route.params;

    const openNameEdit = () => {
        navigation.navigate("EditField", {
            user: user,
            fieldName: "Name", 
            fieldInput: user.name, //might have to change this
            description: "Choose your name to let friends find you.", 
            placeholder: "required", 
        })
    }

    const openUsernameEdit = () => {
        navigation.navigate("EditField", {
            user: user,
            fieldName: "Username", 
            fieldInput: user.username,
            description: "Choose a unique username to help friends tag you.", 
            placeholder: "required", 
        })
    }

    const openBioEdit = () => {
        navigation.navigate("EditField", {
            user: user,
            fieldName: "Bio", 
            fieldInput: user.bio,
            description: "Choose your bio and add a personal touch.", 
            placeholder: "optional", 
        })
    }

    // profile pic, name, username, bio
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topContainer}>
              <TouchableOpacity onPress={navigation.goBack} style={{width: 50}}>
                <Ionicons name='chevron-back' size={24} color={colors.primary}/>
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Edit Profile</Text>
              </View>
              <View style={{width: 50}}/>
          </View>
            <TouchableWithoutFeedback style={{flex: 1}} onPress={() => {Keyboard.dismiss()}}>
                <KeyboardAvoidingView style={styles.editContainer}>
                    <UploadImage userID={user.id} />
                    <TouchableOpacity onPress={openNameEdit}style={styles.textEditContainer}>
                        <Text style={styles.prompt}>Name</Text>
                        <Text style={styles.textInput}>{user.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openUsernameEdit} style={styles.textEditContainer}>
                        <Text style={styles.prompt}>Username</Text>
                        <Text style={styles.textInput}>{user.username}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openBioEdit} style={styles.textEditContainer}>
                        <Text style={styles.prompt}>Bio</Text>
                        <Text style={styles.textInput}>{user.bio}</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
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
    title: {
        fontFamily: fonts.bold,
        color: colors.primary,
        fontSize: 18,
    },
    editContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        margin: 10,
        alignItems: 'center',
        flex: 1
    },
    textEditContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10
    },
    prompt: {
        fontSize: 18,
        flex: 3,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    textInput: {
        fontSize: 18,
        flex: 7,
        fontFamily: fonts.regular,
        color: colors.primary,
    }
});

export default EditProfileScreen;