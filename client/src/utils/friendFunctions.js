import axios from "axios";

export const addFriend = async (userId) => { // add person to AllFriends, remove person from FriendRequests, add current user to AllFriends, remove currentUser from SentRequests
    try {
        await axios.post(`http://localhost:8800/api/friends/${userId}`);
        return "friend";
    } catch (error) {
        console.error("Error adding friend:", error);
        const data = error.response?.data;
        if (data?.error?.code === "INCORRECT_FRIEND_STATUS") {
            return data.error.friendStatus; // Return the status for client state
        }
        return false;
    }
}

export const deleteRequest = async (userId) => {
    try {
        await axios.delete(`http://localhost:8800/api/friends/request/incoming/${userId}`);
        return "stranger";
    } catch (error) {
        console.error("Error deleting pending request:", error);
        const data = error.response?.data;
        if (data?.error?.code === "INCORRECT_FRIEND_STATUS") {
            return data.error.friendStatus; // Return the status for client state
        }
        return false;
    }
}

export const deletePendingRequest = async (userId) => {
    try {
        await axios.delete(`http://localhost:8800/api/friends/request/outgoing/${userId}`);
        return "stranger";
    } catch (error) {
        console.error("Error deleting pending request:", error.response.data);
        const data = error.response?.data;
        if (data?.error?.code === "INCORRECT_FRIEND_STATUS") {
            return data.error.friendStatus; // Return the status for client state
        }
        return false;
    }
}

export const deleteFriend = async (userId) => {
    try {
        await axios.delete(`http://localhost:8800/api/friends/${userId}`);
        return "stranger";
    } catch (error) {
        console.error("Error deleting friend:", error);
        const data = error.response?.data;
        if (data?.error?.code === "INCORRECT_FRIEND_STATUS") {
            return data.error.friendStatus; // Return the status for client state
        }
        return false;
    }
}

export const requestUser = async (userId) => { // update currentusers requesting, update other user's requested
    try {
        await axios.post(`http://localhost:8800/api/friends/request/${userId}`);
        return "userSentRequest";
    } catch (error) {
        console.error("Error requesting user:", error);
        const data = error.response?.data;
        if (data?.error?.code === "INCORRECT_FRIEND_STATUS") {
            return data.error.friendStatus; // Return the status for client state
        }
        return false;
    }
}

export const fetchFriends = async (userID) => { 
    try {
        const response = await axios.get(`http://localhost:8800/api/friends/${userID}`);
        return response.data.body;
    } catch (error) {
        console.error("Error fetching friends:", error);
        return [];
    }
}

export const fetchRequests = async () => {
    try {
        const response = await axios.get(`http://localhost:8800/api/friends/request/incoming`);
        return response.data.body;
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        return [];
    }
}


export function fetchProfiles(friends, setProfiles) { //friends, setProfiles
    const currentUser = FIREBASE_AUTH.currentUser;
    try {
        const friendUIDs = friends.map(doc => doc.id);
        const profilesRef = collection(FIRESTORE_DB, 'Users');
        const unsubscribeProfiles = onSnapshot(profilesRef,
            (snapshot) => {
                const tempProfiles = snapshot.docs
                    .filter(doc => doc.id !== currentUser.uid && !friendUIDs.includes(doc.id))
                    .map(doc => ({ id: doc.id, ...doc.data() }));
                setProfiles(tempProfiles);
            }
        );
        return unsubscribeProfiles;
    } catch (error) {
        console.error("Error fetching profiles:", error);
    }
}

export const findStatus = async (userID) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (userID === currentUser.uid) {
        return "currentUser";
    }
    const [friendsSnap, requestSnap, sentRequestSnap] = await Promise.all([
        getDocs(collection(FIRESTORE_DB, "Requests", currentUser.uid, "AllFriends")),
        getDocs(collection(FIRESTORE_DB, "Requests", currentUser.uid, "FriendRequests")),
        getDocs(collection(FIRESTORE_DB, "Requests", currentUser.uid, "SentRequests")),
    ]);
    const isFriend = friendsSnap.docs.some(doc => doc.id === userID);
    if (isFriend) {
        return "friend";
    }
    const isRequest = requestSnap.docs.some(doc => doc.id === userID);
    if (isRequest) {
        return "userReceivedRequest";
    }
    const isSentRequest = sentRequestSnap.docs.some(doc => doc.id === userID);
    if (isSentRequest) {
        return "userSentRequest";
    }           
    return "stranger";
}