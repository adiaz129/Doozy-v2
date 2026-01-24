import * as ImagePicker from 'expo-image-picker';
import { uploadToFirebase } from '../../firebaseConfig';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';

export const addImage = async (route) => {
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
            const asset = _image.assets[0];
            const compressedUri = await compressImage(asset);
            return await getUploadUnsignedUrl(compressedUri, route);
        }
    } catch (e) {
        console.error("Error Uploading Image " + e.message);
    }
};

export const takePhoto = async (route) => {
    try {
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
            const asset = _image.assets[0];
            const compressedUri = await compressImage(asset);
            return await getUploadUnsignedUrl(compressedUri, route);
        }
    } catch (e) {
        console.error("Error Uploading Image " + e.message);
    }
}

export const getUploadUnsignedUrl = async (localUri, route) => {
    try {
        const response = await axios.post(`http://localhost:8800/api/uploads/${route}`);
        const presignedData = response.data;

        const formData = new FormData();

        Object.entries(presignedData.fields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        formData.append("file", {
            uri: localUri,
            name: presignedData.key.split('/').pop(),
            type: 'image/jpeg'
        });

        const res = await fetch(presignedData.url, {
            method: 'POST',
            body: formData,
        });

        return presignedData.key;

    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}

const compressImage = async (asset) => {
  if (!asset || !asset.uri) throw new Error("Invalid image asset");

  // Default to JPEG
  const format = ImageManipulator.SaveFormat.JPEG;

  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1024 } }], // optional resize
    { compress: 0.7, format }
  );

  return result.uri;
};