import { arrayUnion, writeBatch, increment, arrayRemove, getDocs, getDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../firebaseConfig"
import { doc, collection,  } from "firebase/firestore";
import axios from "axios";


export const fetchComments = async (postID) => {
    try {
        const response = await axios.get(`http://localhost:8800/api/posts/${postID}/comments`);
        return response.data.body;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

export const toggleLike = async (postID, setPosts) => {
    try {
      const response = await axios.post(`http://localhost:8800/api/posts/${postID}/like`);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.post_id === postID
            ? { ...post, user_liked: response.data.user_liked, like_count: response.data.like_count }
            : post
        )
      )
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }

// export const sendLike = async (postID, didLike) => {
//     const currentUser = FIREBASE_AUTH.currentUser;
//     const postRef = doc(FIRESTORE_DB, 'Posts', postID);
//     const postLikeRef = doc(postRef, 'Likes', currentUser.uid);
//     const userLikeRef = doc(FIRESTORE_DB, 'Users', currentUser.uid, 'LikedPosts', postID)
//     const batch = writeBatch(FIRESTORE_DB);
//     if (didLike) {
//         batch.delete(postLikeRef);
//         batch.delete(userLikeRef);
//         batch.update(postRef, { likeCount: increment(-1)});
//     }
//     else {
//         batch.set(postLikeRef, {})
//         batch.set(userLikeRef, {});
//         batch.update(postRef, { likeCount: increment(1)});
//     }
//     await batch.commit();
// }

export const sendComment = async (postID, comment) => {
    try {
        const response = await axios.post(`http://localhost:8800/api/posts/${postID}/comment`,{comment});
        return response.data;
    } catch (error) {
        console.error("Error fetching comments:", error);
    }
}

export const deleteComment = async (postID, commentID) => {
    try {
        const response = await axios.delete(`http://localhost:8800/api/posts/${postID}/comment/${commentID}`);
        return response.data.comment_count;
    } catch (error) {
        console.error("Error fetching comments:", error);
    }
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