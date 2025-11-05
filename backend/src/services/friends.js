import { pool } from "../config/db.js";

export const checkFriendStatusInDB = async (currUser, fetchingUser) => {
    try {
        const q1 = `SELECT COUNT(*) FROM friends WHERE user_id1 = LEAST(?, ?) AND user_id2 = GREATEST(?, ?);`;
        const values1 = [currUser, fetchingUser, currUser, fetchingUser];
        const [result1] = await pool.query(q1, values1);
        if (result1 > 0) {
            return {success: true, friendStatus: "friends"};
        }

        const q2 = `SELECT COUNT(*) FROM requests WHERE requesting_id = ? AND receiving_id = ?;`;
        const values2 = [currUser, fetchingUser];
        const [result2] = await pool.query(q2, values2);
        if (result2 > 0) {
            return {success: true, friendStatus: "userSentRequest"};
        }

        const values3 = [fetchingUser, currUser];
        const [result3] = await pool.query(q2, values3);
        if (result3 > 0) {
            return {success: true, friendStatus: "userReceivedRequest"};
        }

        return {success: true, friendStatus: "stranger"}
    } catch (error) {
        return {success: false}
    }
}