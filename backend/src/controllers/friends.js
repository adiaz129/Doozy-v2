import { requestFriendInDB, deleteFriendRequestInDB, addFriendInDB, deleteFriendInDB, getIncomingFriendRequestsFromDB, getAllFriendsFromDB } from '../services/friends.js';

export const requestFriend = async (req, res) => {
    try {
        const requestingId = req.user.uid;
        const receivingId = req.params.user_id;

        if (req.friendStatus !== "stranger") {
            return res.status(400).json({ 
                error: {
                    code: "INCORRECT_FRIEND_STATUS",
                    message: `Incorrect friend status: ${req.friendStatus}`,
                    friendStatus: req.friendStatus
                }
            });
        }

        const response = await requestFriendInDB(requestingId, receivingId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json({response});
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const deleteOutgoingFriendRequest = async (req, res) => {
    try {
        const requestingId = req.user.uid;
        const receivingId = req.params.user_id;

        if (req.friendStatus !== "userSentRequest") {
            return res.status(400).json({ 
                error: {
                    code: "INCORRECT_FRIEND_STATUS",
                    message: `Incorrect friend status: ${req.friendStatus}`,
                    friendStatus: req.friendStatus
                }
            });
        }

        const response = await deleteFriendRequestInDB(requestingId, receivingId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const deleteIncomingFriendRequest = async (req, res) => {
    try {
        const requestingId = req.params.user_id;
        const receivingId = req.user.uid;

        if (req.friendStatus !== "userReceivedRequest") {
            return res.status(400).json({ 
                error: {
                    code: "INCORRECT_FRIEND_STATUS",
                    message: `Incorrect friend status: ${req.friendStatus}`,
                    friendStatus: req.friendStatus
                }
            });
        }

        const response = await deleteFriendRequestInDB(requestingId, receivingId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const addFriend = async (req, res) => {
    try {
        const requestingId = req.params.user_id;
        const receivingId = req.user.uid;

        if (req.friendStatus !== "userReceivedRequest") {
            console.log(req.friendStatus);
            return res.status(400).json({ 
                error: {
                    code: "INCORRECT_FRIEND_STATUS",
                    message: `Incorrect friend status: ${req.friendStatus}`,
                    friendStatus: req.friendStatus
                }
            });
        }

        const response = await addFriendInDB(requestingId, receivingId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const deleteFriend = async (req, res) => {
    try {
        const friend1 = req.user.uid;
        const friend2 = req.params.user_id;

        if (req.friendStatus !== "friend") {
            return res.status(400).json({ 
                error: {
                    code: "INCORRECT_FRIEND_STATUS",
                    message: `Incorrect friend status: ${req.friendStatus}`,
                    friendStatus: req.friendStatus
                }
            });
        }

        const response = await deleteFriendInDB(friend1, friend2);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const getIncomingFriendRequests = async (req, res) => {
    try {
        const userId = req.user.uid;

        const response = await getIncomingFriendRequestsFromDB(userId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const getAllFriends = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const response = await getAllFriendsFromDB(userId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
    
}