import { Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import colors from "../../../theme/colors";
import fonts from "../../../theme/fonts";


const CameraOptionMenu = (props) => {
    const {onChoose} = props;

    return (
        <SafeAreaView style={styles.modalContainer}>
            <TouchableOpacity onPress={() => onChoose("camera")} style={styles.option}>
                <Feather name="camera" size={18} color={colors.primary} style={styles.icon}/>
                <Text style={{color: colors.primary, ...styles.text}}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChoose("library")} style={styles.option}>
                <MaterialIcons name="photo-library" size={18} color={colors.primary} style={styles.icon}/>
                <Text style={{color: colors.primary, ...styles.text}}>Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChoose("no photo")} style={styles.option}>
                <Feather name="camera-off" size={18} color={colors.primary} style={styles.icon}/>
                <Text style={{color: colors.primary, ...styles.text}}>No Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChoose("no post")} style={styles.option}>
                <Feather name="eye-off" size={18} color={colors.primary} style={styles.icon}/>
                <Text style={{color: colors.primary, ...styles.text}}>Complete (Hidden)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChoose("cancel")} style={styles.option}>
                <Text style={{color: colors.red, ...styles.text}}>Cancel</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4
    },
    option: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        marginRight: 10,
    },
    text: {
        fontSize: 18,
        fontFamily: fonts.regular,
    }
})

export default CameraOptionMenu;