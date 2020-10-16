import { IUser } from "../../models/UserModel";

export interface UserResponse {
    result: {
        user?: IUser,
        users?: Array<IUser>
    };
}

export interface SingleUserResponse extends UserResponse {
    result: { user: IUser };
}

export interface MultiUserResponse extends UserResponse {
    result: { users: Array<IUser> };
}