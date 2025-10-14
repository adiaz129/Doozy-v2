export class UserModel {
    name: string;
    email: string;
    password: string;
    username: string;
    username_lower: string;
    profile_pic: string;

    constructor(data: {
        name: string;
        email: string;
        password: string;
        username: string;
        username_lower: string;
        profile_pic: string;
    }) {
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.username = data.username;
        this.username_lower = data.username_lower;
        this.profile_pic = data.profile_pic;
    }
}