import * as ImagePicker from 'expo-image-picker';
import { uploadToFirebase } from '../../firebaseConfig';

export const addImage = async () => {
    try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert("You need to allow permissions to access the library");
            return;
        }
        let _image = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (_image.assets && !_image.canceled) {
            const { uri } = _image.assets[0];
            const fileName = uri.split('/').pop();
            const uploadResp = await uploadToFirebase(uri, `images/${fileName}`, (progress) =>
                console.log(progress)
            );
            return uploadResp.downloadUrl;
        }
    } catch (e) {
        Alert.alert("Error Uploading Image " + e.message);
    }
};

export const takePhoto = async() => {
    try{
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            alert("Permission to access camera is required!")
        }

        let _image = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (_image.assets && !_image.canceled) {
            const { uri } = _image.assets[0];
            const fileName = uri.split('/').pop();
            const uploadResp = await uploadToFirebase(uri, `images/${fileName}`, (progress) =>
                console.log(progress)
            );
            return uploadResp.downloadUrl;
        }
    } catch (e) {
        Alert.alert("Error Uploading Image " + e.message);
    }
}