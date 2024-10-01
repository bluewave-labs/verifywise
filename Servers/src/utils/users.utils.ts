import { readFile } from "fs/promises";
import { User } from "../models/user.model"
import { UserOut } from "../dtos/userOut.dto";

async function getUsers(): Promise<User[]> {
    const users = await readFile("./files/users.json", "utf-8")
    const usersJSON = JSON.parse(users)
    const usersObj: User[] = usersJSON.map((u: { id: string, name: string, email: string, password: string }) => {
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