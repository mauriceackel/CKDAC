export enum UserType {
  STANDARD,
}

export interface UserModel {
  id?: string;
  email: string;
  firstname: string;
  lastname: string;
  type?: UserType;
  password?: string;
  displayname?: string;
}
