import { Role, IRole } from "../models/RoleModel";
import { Types } from "mongoose";
import { UserType } from "../middleware/Authorization";

/**
 * Checks the user permissions on a certain route and a certain method.
 * 
 * @param userId The id of the user to check the permissions for.
 * @param method The HTTP method to check for.
 * @param url The URL to check the permissions for.
 * 
 * @returns The permission level or -1 of the user has no permissions.
 */
export async function checkPermissions(userId: string, userType: UserType, method: string, url: string): Promise<string[]> {

    let roles: IRole[];
    switch (userType) {
        case UserType.USER: {
            roles = await Role.find({ users: userId });
        } break;
        case UserType.SERVICE: {
            roles = await Role.find({ services: userId });
        } break;
        default: throw new Error("Unknown user type");
    }
    roles = roles || [];

    let activities = roles.flatMap(r => r.permissions).flatMap(p => p.activities);
    let matchedActivities = activities.filter(a => (a.method == "*" || a.method == method) && new RegExp(a.url).test(url));

    if (matchedActivities.length > 0) {
        return roles.flatMap(r => r.claims);
    }
    throw new Error("No matching activities.")
}