import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';

const firebaseConfig = {
    apiKey: "AIzaSyATK9inR8xqRgyhc1pjAnWeqibz5oQ5yKc",
    authDomain: "doozy-3d54c.firebaseapp.com",
    projectId: "doozy-3d54c",
    storageBucket: "doozy-3d54c.appspot.com",
    messagingSenderId: "368405163486",
    appId: "1:368405163486:web:1ccba35fac57112321814f",
    measurementId: "G-6RNZVCNRTS"
};

const FIREBASE_APP = initializeApp(firebaseConfig);
const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
const FIRESTORE_DB = getFirestore(FIREBASE_APP);
const FIREBASE_STORAGE = getStorage(FIREBASE_APP);



const uploadToFirebase = async (uri, name, onProgress) => {
  const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
          { resize: { width: 800 } }, // Resize width to 800px (height auto)
      ],
      {
          compress: 0.7, // Quality: 0 (worst) to 1 (best)
          format: ImageManipulator.SaveFormat.JPEG,
      }
  );

  const fetchResponse = await fetch(manipResult.uri);
  const theBlob = await fetchResponse.blob();
  console.log(theBlob);

  const imageRef = ref(getStorage(), name)

  const metadata = {
    cacheControl: 'public, max-age=31536000', // Example: cache for 1 year
    contentType: theBlob.type, // Optional: set content type
  };

  const uploadTask = uploadBytesResumable(imageRef, theBlob, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress && onProgress(progress)
      }, 
      (error) => {
        reject(error);
      }, 
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          downloadUrl,
          metadata: uploadTask.snapshot.metadata,
        })
      }
    );
  });
}

// const downloadFromFirebase = async (fileName) => {
//   const storage = getStorage();
//   const imageRef = ref(storage, `images/${fileName}`);

//   return new Promise((resolve, reject) => {
//     getDownloadURL(imageRef)
//     .then((url) => {
//       resolve(url);
//     })
//     .catch((error) => {
//       reject(error);
//     })
//   })
// }


export { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE_DB, FIREBASE_STORAGE, uploadToFirebase };