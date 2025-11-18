import { pool } from "../config/db.js";

export const checkFriendStatusInDB = async (currUser, fetchingUser) => {
    try {
        const q1 = `SELECT COUNT(*) AS isFriend FROM friends WHERE user_id1 = LEAST(?, ?) AND user_id2 = GREATEST(?, ?);`;
        const values1 = [currUser, fetchingUser, currUser, fetchingUser];
        const [result1] = await pool.query(q1, values1);
        if (result1[0].isFriend > 0) {
            return {success: true, friendStatus: "friend"};
        }

        const q2 = `SELECT COUNT(*) AS isRequesting FROM requests WHERE requesting_id = ? AND receiving_id = ?;`;
        const values2 = [currUser, fetchingUser];
        const [result2] = await pool.query(q2, values2);
        if (result2[0].isRequesting > 0) {
            return {success: true, friendStatus: "userSentRequest"};
        }

        const values3 = [fetchingUser, currUser];
        const [result3] = await pool.query(q2, values3);
        if (result3[0].isRequesting > 0) {
            return {success: true, friendStatus: "userReceivedRequest"};
        }

        return {success: true, friendStatus: "stranger"}
    } catch (error) {
        console.error(error)
        return {success: false}
    }
}

export const checkFriendStatusByPostInDB = async (postId, userId) => {
    try {
        const q = `SELECT p.user_id, COUNT(f.user_id1) AS hasAccess FROM posts p
                    LEFT JOIN friends f ON f.user_id1 = LEAST(p.user_id, ?) AND f.user_id2 = GREATEST(p.user_id, ?)
                    WHERE post_id = ?;`;
        const values = [userId, userId, postId];
        const [result] = await pool.query(q, values);

        if (result[0].hasAccess > 0 || result[0].user_id == userId) {
            return {success: true, access: true};
        }
        else {
            return {success: true, access: false};
        }
    } catch (error) {
        return {success: false}
    }
}

export const requestFriendInDB = async (requestingId, receivingId) => {
    try {
        const q = `INSERT INTO requests (requesting_id, receiving_id) VALUES (?, ?);`;
        const values = [requestingId, receivingId];
        const [result] = await pool.query(q, values);
        
        return { success: true, message: 'Successful friend request.' };
    } catch (error) {
        console.log(error)
        return { success: false, message: 'Failed friend request.' };
    }
}

export const deleteFriendRequestInDB = async (requestingId, receivingId) => {
    try {
        const q = `DELETE FROM requests WHERE requesting_id = ? AND receiving_id = ?;`;
        const values = [requestingId, receivingId];
        const [result] = await pool.query(q, values);

        return { success: true, message: 'Successful friend request deletion.' };
    } catch (error) {
        console.log(error)
        return { success: false, message: 'Failed friend request deletion.' };
    }
}

export const addFriendInDB = async (requestingId, receivingId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const q1 = `DELETE FROM requests WHERE requesting_id = ? AND receiving_id = ?;`;
        const values1 = [requestingId, receivingId];
        const [result1] = await connection.query(q1, values1);

        const q2 = `INSERT INTO friends (user_id1, user_id2) VALUES (?, ?);`;
        const values2 = [Math.min(requestingId, receivingId), Math.max(requestingId, receivingId)];
        const [result2] = await connection.query(q2, values2);

        const q3 = `UPDATE users
                    SET friend_count = friend_count + 1
                    WHERE user_id = ? OR user_id = ?;`;
        const values3 = [requestingId, receivingId];
        const [result3] = await connection.query(q3, values3);

        await connection.commit();
        return { success: true, message: 'Successful adding friend.' };
    } catch (error) {
        console.log(error)
        return { success: false, message: 'Failed adding friend.'};
    } finally {
        connection.release();
    }
}

export const deleteFriendInDB = async (friend1, friend2) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const q1 = `DELETE FROM friends WHERE user_id1 = ? AND user_id2 = ?;`;
        const values1 = [Math.min(friend1, friend2), Math.max(friend1, friend2)];
        const [result1] = await connection.query(q1, values1);

        const q2 = `UPDATE users
                    SET friend_count = friend_count - 1
                    WHERE user_id = ? OR user_id = ?;`;
        const values2 = [friend1, friend2];
        const [result2] = await connection.query(q2, values2);

        await connection.commit();
        return { success: true, message: 'Successful friend deletion.' };
    } catch (error) {
        console.log(error)
        return { success: false, message: 'Failed friend deletion.' };
    } finally {
        connection.release();
    }
}

export const getIncomingFriendRequestsFromDB = async (userId) => {
    try {
        const q = `SELECT u.user_id, u.name, u.username, u.profile_pic, r.created_at
                    FROM users u
                    JOIN requests r ON r.requesting_id = u.user_id AND r.receiving_id = ?
                    ORDER BY r.created_at DESC;`;
        const [result] = await pool.query(q, [userId]);
        const updatedResult = result.map(item => ({
            ...item,
            friendStatus: 'userReceivedRequest'
        }));

        return { success: true, message: 'Successful retrieving friend requests.', body: updatedResult};
    } catch (error) {
        return { success: false, message: 'Failed to retrieve friend requests.'};
    }
}

export const getAllFriendsFromDB = async (userId) => {
    try {
        const q = `SELECT u.user_id, u.name, u.username, u.profile_pic
                    FROM users u
                    JOIN friends f ON (f.user_id1 = u.user_id AND f.user_id2 = ?) 
                        OR (f.user_id1 = ? AND f.user_id2 = u.user_id);`
        const values = [userId, userId];
        
        const [result] = await pool.query(q, values);

        return {success: true, message: "Successful retrieving friends.", body: result};
    } catch (error) {
        return error;
    }
}