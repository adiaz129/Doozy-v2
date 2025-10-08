import { StyleSheet, TouchableWithoutFeedback, View, Text, TouchableOpacity } from "react-native";
import colors from "../theme/colors";
import fonts from "../theme/fonts";


const ConfirmationModal = (props) => {
    const { confirm, deny, cancel, title, description, confirmText, denyText, confirmColor, denyColor } = props;

    return (
        <TouchableWithoutFeedback onPress={cancel} style={styles.container}>
            <View style={styles.confirmationShadow}>
                <TouchableWithoutFeedback>
                    <View style={styles.confirmationContainer}>
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.titleText}>{title}</Text>
                            <Text style={styles.descriptionText}>{description}</Text>
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={deny} style={styles.denyContainer}>
                                <Text style={[styles.denyText, {color: denyColor}]}>{denyText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirm} style={styles.confirmContainer}>
                                <Text style={[styles.confirmText, {color: confirmColor,}]}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    confirmationShadow: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Android shadow
        elevation: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationContainer: {
        backgroundColor: colors.surface,
        height: 175,
        width: 300,
        borderRadius: 15,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    descriptionContainer: {
        flex: 2,
        paddingHorizontal: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingTop: 10,
    },
    titleText: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.primary,
        paddingBottom: 10,
    },
    descriptionText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.primary,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    confirmContainer: {
        width: '50%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: .5,
        borderLeftColor: '#ccc',
    },
    confirmText: {
        fontFamily: fonts.bold,
        fontSize: 18,
    },
    denyContainer: {
        width: '50%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: .5,
        borderRightColor: '#ccc',
    },
    denyText: {
        fontFamily: fonts.bold,
        fontSize: 18,
    },
});

export default ConfirmationModal;