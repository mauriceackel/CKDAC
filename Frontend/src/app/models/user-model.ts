export enum UserType {
  STANDARD
}

export interface IUser {
  id: string
  email: string,
  firstname: string,
  lastname: string
  type: UserType,
  password?: string
  displayname?: string,
}
