import { User } from "../../models/user.model";
import { IUserRepository } from "../iUser.repository";

const { writeFile, readFile } = require('fs').promises;

async function getUsers() {
    const users = await readFile("./files/users.json", "utf-8")
    return <User[]>JSON.parse(users);
}

export class UserRepository implements IUserRepository {
    // get db connection

    getAll(): Promise<User[]> {
        return getUsers();
    }

    async getOne(id: number): Promise<User | undefined> {
        const users = await getUsers();
        return new Promise((resolve) => {
            resolve(users.find(u => u.id === id))
        })
    }

    async create(input: User): Promise<User> {
        await writeFile("./files/users.json", JSON.stringify(input))
        const user = await this.getOne(input.id)
        return new Promise((resolve) => {
            resolve(user!)
        })
    }

    async delete(id: number): Promise<number> {
        const users = await getUsers()

        const filteredUsers = users.filter(u => {
            return u.id !== id
        });

        await writeFile("./files/users.json", JSON.stringify(filteredUsers))
        return new Promise((resolve) => {
            resolve(users.length - filteredUsers.length)
        })
    }

    async update(id: number, input: any): Promise<User> {
        const users = await getUsers()
        const userIndex = users.map(u => u.id).indexOf(id)
        const filteredUser = users[userIndex];

        Object.keys(input).map(b => {
            filteredUser[b] = input[b]
        })
        users[userIndex] = filteredUser
        await writeFile("./files/users.json", JSON.stringify(users))
        const user = await this.getOne(input.id)
        return new Promise((resolve) => {
            resolve(user!)
        })
    }

}