import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { writeBatch, doc, getDoc, increment, onSnapshot, collection, getDocs } from "firebase/firestore";

export const addFriend = async (friend) => { // add person to AllFriends, remove person from FriendRequests, add current user to AllFriends, remove currentUser from SentRequests
    const currentUser = FIREBASE_AUTH.currentUser;

    if (!currentUser) return;

    const currUserProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
    const otherUserProfileRef = doc(FIRESTORE_DB, 'Users', friend.id);
    const allFriendProfileRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "AllFriends", friend.id);
    const friendReqProfileRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "FriendRequests", friend.id);
    const currUserAllFriendsRef = doc(FIRESTORE_DB, "Requests", friend.id, "AllFriends", currentUser.uid);
    const currUserSentReqRef = doc(FIRESTORE_DB, "Requests", friend.id, "SentRequests", currentUser.uid);
    try {
        const batch = writeBatch(FIRESTORE_DB);
        const userSnap = await getDoc(currUserProfileRef);
        const userData = userSnap.data()
        batch.set(allFriendProfileRef, { name: friend.name, username: friend.username, profilePic: friend.profilePic });
        batch.set(currUserAllFriendsRef, { name: userData.name, username: userData.username, profilePic: userData.profilePic });
        batch.delete(friendReqProfileRef);
        batch.delete(currUserSentReqRef);
        batch.update(currUserProfileRef, { friends: increment(1) });
        batch.update(otherUserProfileRef, { friends: increment(1) });


        await batch.commit()
    } catch (error) {
        console.error("Error adding friend:", error);
    }
}

export const deleteRequest = async (friend) => {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (!currentUser) return;

    const friendReqProfileRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "FriendRequests", friend.id);
    const currUserSentReqRef = doc(FIRESTORE_DB, "Requests", friend.id, "SentRequests", currentUser.uid);

    try {
        const batch = writeBatch(FIRESTORE_DB);
        batch.delete(friendReqProfileRef);
        batch.delete(currUserSentReqRef);
        await batch.commit();
    } catch (error) {
        console.error("Error deleting request:", error);
    }
}

export const deletePendingRequest = async (user) => {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (!currentUser) return;

    const friendReqProfileRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "SentRequests", user.id);
    const currUserSentReqRef = doc(FIRESTORE_DB, "Requests", user.id, "FriendRequests", currentUser.uid);

    try {
        const batch = writeBatch(FIRESTORE_DB);
        batch.delete(friendReqProfileRef);
        batch.delete(currUserSentReqRef);
        await batch.commit();
    } catch (error) {
        console.error("Error deleting pending request:", error);
    }
}

export const deleteFriend = async (friend) => { // add this later
    const currentUser = FIREBASE_AUTH.currentUser;

    if (!currentUser) return;

    const currUserProfileRef = doc(FIRESTORE_DB, "Users", currentUser.uid);
    const friendProfileRef = doc(FIRESTORE_DB, "Users", friend.id);
    const currUserFriendRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "AllFriends", friend.id);
    const recUserFriendRef = doc(FIRESTORE_DB, "Requests", friend.id, "AllFriends", currentUser.uid);

    try {
        const batch = writeBatch(FIRESTORE_DB);
        batch.delete(currUserFriendRef);
        batch.delete(recUserFriendRef);
        // add decrement friend !!!
        batch.update(friendProfileRef, { friends: increment(-1) });
        batch.update(currUserProfileRef, { friends: increment(-1) });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting friend:", error);
    }
}

export const requestUser = async (user) => { // update currentusers requesting, update other user's requested
    const currentUser = FIREBASE_AUTH.currentUser;

    const currUserProfileRef = doc(FIRESTORE_DB, 'Users', currentUser.uid);
    const requestingRef = doc(FIRESTORE_DB, "Requests", currentUser.uid, "SentRequests", user.id);
    const requestedRef = doc(FIRESTORE_DB, "Requests", user.id, "FriendRequests", currentUser.uid);

    try {
        const batch = writeBatch(FIRESTORE_DB);
        const userSnapshot = await getDoc(currUserProfileRef);
        const userData = userSnapshot.data();
        batch.set(requestedRef, { name: userData.name, username: userData.username, profilePic: userData.profilePic });
        batch.set(requestingRef, { name: user.name, username: user.username, profilePic: user.profilePic });
        await batch.commit();
        console.log("user request successful")
    } catch (error) {
        console.error("Error requesting user:", error);
    }
}

export function fetchFriends(setFriends, userID) { //setFriends
    try {
        const AllFriendsRef = collection(FIRESTORE_DB, 'Requests', userID, 'AllFriends');

        const unsubscribeFriends = onSnapshot(AllFriendsRef,
            (snapshot) => {
                const tempFriends = [];
                snapshot.forEach((doc) => {
                    tempFriends.push({ id: doc.id, ...doc.data() });
                });
                setFriends(tempFriends);
            });
        return unsubscribeFriends;
    } catch (error) {
        console.error("Error fetching friends:", error);
    }
}

export function fetchRequests(setReqFriends) { //setReqFriends
    const currentUser = FIREBASE_AUTH.currentUser;
    try {
        const friendsReqRef = collection(FIRESTORE_DB, 'Requests', currentUser.uid, 'FriendRequests');
        const unsubscribeRequests = onSnapshot(friendsReqRef,
            (snapshot) => {
                const tempFriendsReq = []
                snapshot.forEach((doc) => {
                    tempFriendsReq.push({ id: doc.id, ...doc.data() });
                });
                setReqFriends(tempFriendsReq);
            }
        );
        return unsubscribeRequests;
    } catch (error) {
        console.error("Error fetching friend requests:", error);
    }
}
export function fetchRequesting(setRequesting) { //setRequesting(user sent requests)
    const currentUser = FIREBASE_AUTH.currentUser;
    try {
        const requestingRef = collection(FIRESTORE_DB, "Requests", currentUser.uid, "SentRequests");
        const unsubscribeRequesting = onSnapshot(requestingRef,
            (snapshot) => {
                const tempRequesting = []
                snapshot.forEach((doc) => {
                    tempRequesting.push({ id: doc.id });
                });
                setRequesting(tempRequesting);
            }
        );
        return unsubscribeRequesting;
    } catch (error) {
        console.error("Error fetching requesting:", error);
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