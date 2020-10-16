import { SuccessResponse } from "./ApiResponse";
import { IUser } from "../../models/UserModel";

export abstract class UserResponse extends SuccessResponse {
    public get Result(): { user?: IUser, users?: Array<IUser> } {
        return this.result;
    } 

    protected result: {
        user?: IUser,
        users?: Array<IUser>
    };

    constructor(code: number, messages: Array<string>) {
        super(code, messages);
        this.result = {};
    }
}

export class SingleUserResponse extends UserResponse {
    
    constructor(code: number, messages: Array<string> = [], user: IUser) {
        super(code, messages);
        this.result.user = user;
    }
}

export class MultiUserResponse extends UserResponse {
    
    constructor(code: number, messages: Array<string> = [], users: Array<IUser>) {
        super(code, messages);
        this.result.users = users;
    }
}