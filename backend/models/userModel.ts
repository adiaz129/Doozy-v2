class UserModel {
    user_id: number;
    email: string;
    password: string;
    username: string;
    username_lower: string;
    bio?: string | null;
    profile_pic: string;
    post_count: number;
    task_count: number;
    friend_count: number;

    constructor(data: {
        user_id: number;
        email: string;
        password: string;
        username: string;
        username_lower: string;
        bio?: string | null;
        profile_pic: string;
        post_count: number;
        task_count: number;
        friend_count: number;
    }) {
        this.user_id = data.user_id;
        this.email = data.email;
        this.password = data.password;
        this.username = data.username;
        this.username_lower = data.username_lower;
        this.bio = data.bio ?? null;
        this.profile_pic = data.profile_pic;
        this.post_count = data.post_count;
        this.task_count = data.task_count;
        this.friend_count = data.friend_count;
    }
}