import { Role } from "../models/RoleModel";

export async function addUserToRole(userId: string, roleName: string) {
    try {
        await Role.updateOne({name: roleName}, { $push: { users: userId } })
    } catch (err) {

    }
}