import { arrayUnion, writeBatch, increment, arrayRemove, getDocs, getDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../firebaseConfig"
import { doc, collection,  } from "firebase/firestore";
import axios from "axios";


export const fetchComments = async (postID) => {
    const commentsRef = collection(FIRESTORE_DB, 'Posts', postID, 'Comments');
    const snapshot = await getDocs(commentsRef);
    const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
    return commentList;
}

export const sendLike = async (postID, didLike) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    const postRef = doc(FIRESTORE_DB, 'Posts', postID);
    const postLikeRef = doc(postRef, 'Likes', currentUser.uid);
    const userLikeRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'LikedPosts', postID)
    const batch = writeBatch(FIRESTORE_DB);
    if (didLike) {
        batch.delete(postLikeRef);
        batch.delete(userLikeRef);
        batch.update(postRef, { likeCount: increment(-1)});
    }
    else {
        batch.set(postLikeRef, {})
        batch.set(userLikeRef, {});
        batch.update(postRef, { likeCount: increment(1)});
    }
    await batch.commit();
}

export const sendComment = async (postID, comment) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    const postRef = doc(FIRESTORE_DB, 'Posts', postID);
    const commentRef = doc(collection(FIRESTORE_DB, 'Posts', postID, 'Comments'));
    const currUserRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);

    const userSnap = await getDoc(currUserRef);
    const userData = userSnap.data();

    const batch = writeBatch(FIRESTORE_DB);
    batch.set(commentRef, {userID: currentUser.uid, profilePic: userData.profilePic, username: userData.username, comment: comment, timePosted: new Date()});
    batch.update(postRef, { commentCount: increment(1) });

    await batch.commit();
}

export const deleteComment = async (postID, commentID) => {
    const batch = writeBatch(FIRESTORE_DB);
    batch.delete(doc(FIRESTORE_DB, 'Posts', postID, 'Comments', commentID));
    batch.update(doc(FIRESTORE_DB, 'Posts', postID), {commentCount: increment(-1)});
    await batch.commit();
}

export const fetchLikes = async (postID) => {
    try {
    const response = await axios.get(`http://localhost:8800/api/posts/${postID}/likes`);
    return response.data.body;
    } catch (error) {
        console.error(error.response.data.message);
        return [];
    }    
}