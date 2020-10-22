export enum UserType {
    STANDARD
}

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IUser {
    id: string
    email: string,
    firstname: string,
    lastname: string,
    type: UserType,
    displayname? : string,
}