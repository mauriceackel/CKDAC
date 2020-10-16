import { SuccessResponse } from "./api-response";
import { IUser } from "../../models/user-model";

export interface UserResponse extends SuccessResponse {
    result: {
        user?: IUser,
        users?: Array<IUser>
    };
}

export interface SingleUserResponse extends UserResponse {
    result: { user: IUser };
}

export interface MultiUserResponse extends UserResponse {
    result: { users : IUser[] };
}
