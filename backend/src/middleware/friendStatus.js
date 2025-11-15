import { checkFriendStatusInDB, checkFriendStatusByPostInDB } from "../services/friends.js";

export const checkFriendStatus = async (req, res, next) => {
    if (req.user.uid === Number(req.params.user_id)) {
        req.friendStatus = "currentUser";
        return next();
    }
    else {
        const response = await checkFriendStatusInDB(req.user.uid, req.params.user_id);
        if (response.success) {
            req.friendStatus = response.friendStatus;
            return next();
        }
        else {
            return res.status(500).json({error: "Database Error"});
        }
    }
}

export const checkFriendStatusByPost = async (req, res, next) => {
    const postId = req.params.post_id;
    const userId = req.user.uid;
    const response = await checkFriendStatusByPostInDB(postId, userId);
    if (response.success) {
        if (response.access) {
            return next();
        }
        else {
            return res.status(403).json({error: "Forbidden"});
        }
    }
    else {
        return res.status(500).json({error: "Database Error"});
    }
}