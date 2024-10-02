import { Request, Response } from "express";

import { User } from "../models/user.model";
import { UserOut } from "../dtos/userOut.dto";
import { UserIn } from "../dtos/userIn.dto";

import { writeFile } from "fs/promises";
import bcrypt from "bcrypt";
import { getUserOut, getUsers } from "../utils/users.utils";
import { IUserAuthRequest } from "../types/IUserAuthRequest";
import { generateToken } from "../utils/jwt.utils";

type UserParams = Partial<Pick<User, "id" | "name" | "email">>;

async function getAllUsers(req: IUserAuthRequest, res: Response): Promise<any> {
    try {
        let users = await getUsers()
        let usersOut = getUserOut(users) as UserOut[]

        return res.json({ data: usersOut })
    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

async function findUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const params = req.query as UserParams
    const users = await getUsers()

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
        const users = await getUsers()
        let found = false

        for (let u of users) {
            if (u.id === userId) {
                return res.json({ data: getUserOut(u) as UserOut })
            }
        }

        return res.status(404).json({ data: `user with id: ${userId} not found` })

    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

async function createUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userIn = req.body as UserIn
    const users = await getUsers()
    const usersCtr = users.length

    for (let u of users) {
        if (u.email === userIn.email) {
            return res.status(400).json({ data: `user with email: ${userIn.email} already exists` })
        }
    }

    const user: User = {
        id: usersCtr + 1,
        created_at: Date.now(),
        last_login: -1,
        role_id: 1,
        name: userIn.name,
        email: userIn.email,
        password: await bcrypt.hash(userIn.password, process.env.SALT as string)
    }
    users.push(user)

    try {
        await writeFile("./files/users.json", JSON.stringify(users))
        return res.status(201).json({ data: getUserOut(user) as UserOut })
    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

async function deleteUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userId = parseInt(req.params.id);
    try {
        const users = await getUsers()

        const filteredUsers = users.filter(u => {
            return u.id !== userId
        });

        if (users.length === filteredUsers.length) {
            return res.status(400).json({ data: `user with id: ${userId} not found` })
        } else {
            await writeFile("./files/users.json", JSON.stringify(filteredUsers))
            return res.status(204).send()
        }

    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

async function updateUser(req: IUserAuthRequest, res: Response): Promise<any> {
    const userId = parseInt(req.params.id);
    try {
        let users = await getUsers()
        let body = req.body as UserIn
        const userIndex = users.map(u => u.id).indexOf(userId)
        const filteredUser: User = users[userIndex];

        if (filteredUser) {
            // TODO: write a logic to change update email and password of the user
            const nonUpdatableFields: string[] = Object.keys(body).filter(b =>
                ["email", "password", "id", "created_at", "last_login", "role_id"].includes(b))

            if (nonUpdatableFields.length !== 0) {
                return res.status(400).json({ data: `cannot update ${nonUpdatableFields.join(" and ")} of the user` })
            } else {
                const userKeys = Object.getOwnPropertyNames(User)
                Object.keys(body).forEach(b => {
                    // NOTE: any workaround for this?: "email" | "password" | "name"

                    if (userKeys.includes(b)) {
                        (filteredUser as any)[b] = body[b as keyof UserIn]
                    }
                })
                users[userIndex] = filteredUser
                await writeFile("./files/users.json", JSON.stringify(users))
                return res.status(200).send({ data: getUserOut(filteredUser) as UserOut })
            }
        } else {
            return res.status(400).json({ data: `user with id: ${userId} not found` })
        }
    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

async function resetPassword(req: IUserAuthRequest, res: Response): Promise<any> {
    const { email } = req.query as { email: string }
    const { password } = req.body as { password: string }

    let users = await getUsers()
    const userIndex = users.map(u => u.email).indexOf(email)

    if (userIndex === -1) {
        return res.status(404).json({ data: `user with email: ${email} not found` })
    } else {
        users[userIndex].password = await bcrypt.hash(password, process.env.SALT as string)
        await writeFile("./files/users.json", JSON.stringify(users))
        return res.status(201).send({ data: `password update successful for the user with email: ${email}` })
    }
}

async function login(req: IUserAuthRequest, res: Response) {
    const { email, password } = req.body as { email: string, password: string };
    try {
        const users = await getUsers()
        const user = users.find(u => u.email === email)

        if (!user) return res.status(404).json({ data: `user with email: ${email} not found` });

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) return res.status(400).json({ data: `bad request, please check email or password` });

        return res.json({
            data: 'login successful', token: generateToken({
                id: user.id, email: user.email
            })
        }).send()

    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
}

export { getAllUsers, findUser, getUserFromId, createUser, deleteUser, updateUser, resetPassword, login };
