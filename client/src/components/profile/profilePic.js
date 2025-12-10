import React, { useState, useEffect } from 'react';
import { Image, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FIREBASE_AUTH, FIRESTORE_DB, uploadToFirebase, FIREBASE_STORAGE } from '../../../firebaseConfig';
import { doc, updateDoc, getDoc, writeBatch, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { getReferenceFromUrl, ref, getStorage, deleteObject } from 'firebase/storage';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';
import axios from 'axios';


export default function UploadImage(props) {
    const { userID, profilePic } = props;
    const [image, setImage] = useState(profilePic);
    console.log(profilePic)

    function getStoragePathFromUrl(url) {
        // Extract the part after '/o/' and before '?'
        const match = url.match(/\/o\/([^?]+)/);
        if (!match) return null;
        // URL-decode the path
        return decodeURIComponent(match[1]);
    }

    const addImage = async () => {
        try {
            let _image = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (_image.assets && !_image.cancelled) {
                const { uri } = _image.assets[0];
                const fileName = uri.split('/').pop();
                const uploadResp = await uploadToFirebase(uri, `profilePics/${fileName}`, (progress) =>
                    console.log(progress)
                );
                await updateProfilePicture(uploadResp.downloadUrl);
            }
        } catch (e) {
            Alert.alert("Error Uploading Image " + e.message);
        }
    };


    const updateProfilePicture = async (downloadUrl) => {
        try { //I have to update it in Users, for each AllFriends/AllFriends/currentUserId, for each ownRequests/FriendRequests/currentUserId
            if (!downloadUrl) {
                throw new Error("Image Not Found");
            }
            const prevProfilePic = image;

            await axios.patch(`http://localhost:8800/api/users`, {profile_pic: downloadUrl});

            const storagePath = getStoragePathFromUrl(prevProfilePic);
            if (storagePath !== "profilePics/default.jpg") {
                const profilePicRef = ref(getStorage(), storagePath);
                deleteObject(profilePicRef);
            }
            
            setImage(downloadUrl);
            // update profile pic on each SentRequests
            console.log('Profile picture updated successfully!');
        } catch (error) {
            const storagePath = getStoragePathFromUrl(downloadUrl);
            if (storagePath !== "profilePics/default.jpg") {
                const profilePicRef = ref(getStorage(), storagePath);
                deleteObject(profilePicRef);
            }
            console.error('Error updating profile picture: ', error);
        }
    };
    return (
        <View style={imageUploaderStyles.container}>
            {
                image && <Image source={{ uri: image }} style={{ width: 100, height: 100 }} />
            }
            <View style={imageUploaderStyles.uploadBtnContainer}>
                <TouchableOpacity onPress={addImage} style={imageUploaderStyles.uploadBtn} >
                    <Text style={imageUploaderStyles.editImage}>{image ? 'Edit' : 'Upload'} Image</Text>
                    <MaterialIcons name="photo-library" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
const imageUploaderStyles = StyleSheet.create({
    container: {
        elevation: 2,
        height: 100,
        width: 100,
        position: 'relative',
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 20,
        marginTop: 0,
    },
    uploadBtnContainer: {
        opacity: 0.5,
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: colors.tint,
        width: '100%',
        height: '45%',
    },
    editImage: {
        fontFamily: fonts.regular,
        color: colors.primary,
    },
    uploadBtn: {
        display: 'flex',
        alignItems: "center",
        justifyContent: 'center'
    }
})