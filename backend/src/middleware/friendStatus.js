import { checkFriendStatusInDB } from "../services/friends.js";

export const checkFriendStatus = async (req, res, next) => {
    if (req.user.uid === Number(req.params.user_id)) {
        console.log("curruser")
        req.friendStatus = "currentUser";
        return next();
    }
    else {
        const response = await checkFriendStatusInDB(req.user.uid, req.params.user_id);
        if (response.success) {
            req.friendStatus = response.friendStatus;
            if (req.friendStatus === "friends") {
                return next();
            }
            return res.status(403).json({ error: "Forbidden", friendStatus: req.friendStatus });
        }
        else {
            return res.status(500).json({error: "Database Error"});
        }
    }
}