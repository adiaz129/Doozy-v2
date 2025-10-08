import { query, getDocs, collection, where, doc, writeBatch, updateDoc } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';


export const isUsernameUnique = async (username, loggedIn) => {
    const usernameLower = username.toLowerCase();
    const usersRef = collection(FIRESTORE_DB, "Users");
    let q;
    if (loggedIn) {
        const currentUserID = FIREBASE_AUTH.currentUser.uid;
        q = query(usersRef, where('usernameLower', '==', usernameLower), where('__name__', '!=', currentUserID));
    }
    else {
        q = query(usersRef, where('usernameLower', '==', usernameLower));
    }
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
}

export const updateNameField = async (name) => {
    const currentUserID = FIREBASE_AUTH.currentUser.uid;
    const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUserID);
    const userFriendsRef = collection(FIRESTORE_DB, 'Requests', currentUserID, 'AllFriends');
    const userFriendsReqRef = collection(FIRESTORE_DB, 'Requests', currentUserID, 'SentRequests');

    const batch = writeBatch(FIRESTORE_DB);

    if (name.length === 0) {
        throw new Error("Name is required");
    }
    batch.update(userProfileRef, {
        name: name
    });
    if (userFriendsRef) {
        const AllFriendsSnapshot = await getDocs(userFriendsRef);
        AllFriendsSnapshot.forEach((friendDoc) => {
            const friendId = friendDoc.id
            const friendDataRef = doc(FIRESTORE_DB, 'Requests', friendId, 'AllFriends', currentUserID);
            if (!friendDataRef) {
                throw new Error("Friends are not mutual");
            }
            batch.update(friendDataRef, {
                name: name,
            });
        })
    }
    if (userFriendsReqRef) {
        const ReqFriendsSnapshot = await getDocs(userFriendsReqRef);
        ReqFriendsSnapshot.forEach((reqFriendDoc) => {
            const reqFriendId = reqFriendDoc.id;
            const reqFriendDataRef = doc(FIRESTORE_DB, 'Requests', reqFriendId, 'FriendRequests', currentUserID);
            if (!reqFriendDataRef) {
                throw new Error("Friends are not mutually requested");
            }
            batch.update(reqFriendDataRef, {
                name: name,
            });
        })
    }
    await batch.commit();
}

export const updateUsernameField = async (username) => {
    const currentUserID = FIREBASE_AUTH.currentUser.uid;
    const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUserID);
    const userFriendsRef = collection(FIRESTORE_DB, 'Requests', currentUserID, 'AllFriends');
    const userFriendsReqRef = collection(FIRESTORE_DB, 'Requests', currentUserID, 'SentRequests');

    const batch = writeBatch(FIRESTORE_DB);

    if (username.length === 0) {
        throw new Error("Username is required");
    }
    if (!await isUsernameUnique(username, true)) {
        throw new Error("Username is taken")
    }
    batch.update(userProfileRef, {
        username: username,
        usernameLower: username.toLowerCase()
    });
    if (userFriendsRef) {
        const AllFriendsSnapshot = await getDocs(userFriendsRef);
        AllFriendsSnapshot.forEach((friendDoc) => {
            const friendId = friendDoc.id
            const friendDataRef = doc(FIRESTORE_DB, 'Requests', friendId, 'AllFriends', currentUserID);
            if (!friendDataRef) {
                throw new Error("Friends are not mutual");
            }
            batch.update(friendDataRef, {
                username: username,
            });
        })
    }
    if (userFriendsReqRef) {
        const ReqFriendsSnapshot = await getDocs(userFriendsReqRef);
        ReqFriendsSnapshot.forEach((reqFriendDoc) => {
            const reqFriendId = reqFriendDoc.id;
            const reqFriendDataRef = doc(FIRESTORE_DB, 'Requests', reqFriendId, 'FriendRequests', currentUserID);
            if (!reqFriendDataRef) {
                throw new Error("Friends are not mutually requested");
            }
            batch.update(reqFriendDataRef, {
                username: username,
            });
        })
    }
    await batch.commit();
}

export const updateBioField = async (bio) => {
    const currentUserID = FIREBASE_AUTH.currentUser.uid;
    const userProfileRef = doc(FIRESTORE_DB, 'Users', currentUserID);

    await updateDoc(userProfileRef, {
        bio: bio,
    })
}

export const checkNameField = async (name) => {
    if (name.length === 0) {
        const error = new Error("Name is required.");
        error.code = 'name-required';
        throw error;
    }
}

export const checkUsernameField = async (username) => {
    if (username.length === 0) {
        const error = new Error("Username is required.");
        error.code = 'username-required';
        throw error;
    }
    if (!await isUsernameUnique(username, false)) {
        const error = new Error("Username taken.");
        error.code = 'username-taken';
        throw error;
    }
}

export const checkPasswordField = async (password, confirmPassword) => {
    if (password.length === 0) {
        const error = new Error("Password is required.");
        error.code = 'password-required';
        throw error;
    }
    if (password !== confirmPassword) {
        const error = new Error("Passwords don't match.");
        error.code = 'password-mismatch';
        throw error;
    }
}