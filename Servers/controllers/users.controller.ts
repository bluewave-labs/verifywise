import { Request, Response } from "express";

import { User } from "../models/user.model";
import { UserOut } from "../dtos/userOut.dto";
import { UserIn } from "../dtos/userIn.dto";

import { writeFile } from "fs/promises";
import bcrypt from "bcrypt";
import { getUserOut, getUsers } from "../utils/users.utils";
import { IUserAuthRequest } from "../types/IUserAuthRequest";
import { generateToken } from "../utils/jwt.utils";
import { STATUS_CODES } from "../utils/userStatusCodes.utils";

type UserParams = Partial<Pick<User, "id" | "name" | "email">>;

async function getAllUsers(req: IUserAuthRequest, res: Response): Promise<any> {
    try {
        let users = getUsers()
        let usersOut = getUserOut(users) as UserOut[]

        return res.json({ data: usersOut })
    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

async function findUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const params = req.query as UserParams
    const users = getUsers()

    const user = users.find(u => {

        for (let p of Object.keys(params)) {
            if (u[p as keyof UserParams] !== params[p as keyof UserParams]) {
                return false
            }
        }
        return true
    })

    if (user === undefined) {
        return res.status(404).json({ data: `user with ${Object.keys(params).map(p => `${p}: ${params[p as keyof typeof params]}`).join(', ')} not found` })
    } else {
        return res.json({ data: getUserOut(user) as UserOut })
    }
}

async function getUserFromId(req: IUserAuthRequest, res: Response): Promise<any> {
    // assuming the userId will be integer parsable
    const userId = parseInt(req.params.id);
    try {
        const users = getUsers()
        let found = false

        for (let u of users) {
            if (u.id === userId) {
                return res.json({ data: getUserOut(u) as UserOut })
            }
        }

        return STATUS_CODES[404]("id", userId);

    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

async function createUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userIn = req.body as UserIn
    const users = getUsers()
    const usersCtr = users.length

    for (let u of users) {
        if (u.email === userIn.email) {
            return STATUS_CODES[400](`user with email: ${userIn.email} already exists`)
        }
    }

    const user: User = {
        id: usersCtr + 1,
        created_at: Date.now(),
        last_login: -1,
        role_id: 1,
        name: userIn.name,
        email: userIn.email,
        password: await bcrypt.hash(userIn.password, 10)
    }
    users.push(user)

    try {
        await writeFile("./files/users.json", JSON.stringify(users))
        return STATUS_CODES[201](getUserOut(user) as UserOut)
    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

async function deleteUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userId = parseInt(req.params.id);
    try {
        const users = getUsers()

        const filteredUsers = users.filter(u => {
            return u.id !== userId
        });

        if (users.length === filteredUsers.length) {
            return STATUS_CODES[404]("id", userId);
        } else {
            await writeFile("./files/users.json", JSON.stringify(filteredUsers))
            return res.status(204).send()
        }

    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

async function updateUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userId = parseInt(req.params.id);
    try {
        let users = getUsers()
        let body = req.body as UserIn
        const userIndex = users.map(u => u.id).indexOf(userId)
        const filteredUser: User = users[userIndex];

        if (filteredUser) {
            // TODO: write a logic to change update email and password of the user
            const nonUpdatableFields: string[] = Object.keys(body).filter(b =>
                ["email", "password", "id", "created_at", "last_login", "role_id"].includes(b))

            if (nonUpdatableFields.length !== 0) {
                return STATUS_CODES[400](`cannot update ${nonUpdatableFields.join(" and ")} of the user`)
            } else {
                const userKeys = Object.keys(filteredUser)
                Object.keys(body).forEach(b => {
                    // NOTE: any workaround for this?: "email" | "password" | "name"

                    if (userKeys.includes(b)) {
                        (filteredUser as any)[b] = body[b as keyof UserIn]
                    }
                })
                users[userIndex] = filteredUser
                await writeFile("./files/users.json", JSON.stringify(users))
                return STATUS_CODES[200](getUserOut(filteredUser) as UserOut)
            }
        } else {
            return STATUS_CODES[404]("id", userId);
        }
    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

async function resetPassword(req: IUserAuthRequest, res: Response): Promise<any> {
    const { email } = req.query as { email: string }
    const { password } = req.body as { password: string }

    let users = getUsers()
    const userIndex = users.map(u => u.email).indexOf(email)

    if (userIndex === -1) {
        return STATUS_CODES[404]("email", email);
    } else {
        users[userIndex].password = await bcrypt.hash(password, 10)
        await writeFile("./files/users.json", JSON.stringify(users))
        return STATUS_CODES[201](`password update successful for the user with email: ${email}`);
    }
}

async function login(req: IUserAuthRequest, res: Response) {
    const { email, password } = req.body as { email: string, password: string };
    try {
        const users = getUsers()
        const user = users.find(u => u.email === email)

        if (!user) return STATUS_CODES[404]("email", email);

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) return STATUS_CODES[400](`bad request, please check email or password`)

        return res.json({
            data: 'login successful', token: generateToken({
                id: user.id, email: user.email
            })
        });

    } catch (error: any) {
        return STATUS_CODES[500](error);
    }
}

export { getAllUsers, findUser, getUserFromId, createUser, deleteUser, updateUser, resetPassword, login };
