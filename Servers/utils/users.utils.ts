import { users as UserData } from "../mocks/users.data";
import { User } from "../models/user.model"
import { UserOut } from "../dtos/userOut.dto";

function getUsers(): User[] {
    const users = UserData
    const usersObj: User[] = users.map((u) => {
        return Object.setPrototypeOf({ ...u }, User.prototype)
    })
    return usersObj
}

function getUserOut(u: User | User[]): UserOut | UserOut[] {
    if (Array.isArray(u)) {
        return u.map(u => new UserOut(u.id, u.name, u.email, new Date(u.created_at).toUTCString(), new Date(u.last_login).toUTCString()))
    } else {
        return new UserOut(u.id, u.name, u.email, new Date(u.created_at).toUTCString(), new Date(u.last_login).toUTCString())
    }
}

export { getUsers, getUserOut };