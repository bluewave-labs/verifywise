import { Request, Response } from "express";
import { User } from "../models/user.model";
import { UserOut } from "../dtos/userOut.dto";
import { UserIn } from "../dtos/userIn.dto";

const router = require("express").Router();
const { writeFile, readFile } = require('fs').promises;

async function getUsers(): Promise<User[]> {
    let users = await readFile("./files/users.json", "utf-8")
    users = await JSON.parse(users)
    const usersObj: User[] = users.map((u: { id: string, name: string, email: string, password: string }) => {
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

router.get("/", async (req: Request, res: Response) => {
    try {
        let users = await getUsers()
        let usersOut = getUserOut(users) as UserOut[]

        res.json({ data: usersOut })
    } catch (error: any) {
        res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
});

router.get("/find", async (req: Request, res: Response) => {
    const params = req.query as { name?: string, email?: string, id?: number }
    const users = await getUsers()

    const user = users.find(u => {

        for (let p of Object.keys(params)) {
            if (u[p as keyof User] !== params[p as keyof typeof params]) {
                return false
            }
        }
        return true
    })

    if (user === undefined) {
        res.status(404).json({ data: `user with ${Object.keys(params).map(p => `${p}: ${params[p as keyof typeof params]}`).join(', ')} not found` })
    } else {
        res.json({ data: getUserOut(user) as UserOut })
    }
})

router.get("/:id", async (req: Request, res: Response) => {
    // assuming the userId will be integer parsable
    const userId = parseInt(req.params.id);
    try {
        const users = await getUsers()
        let found = false

        for (let u of users) {
            if (u.id === userId) {
                found = true
                res.json({ data: getUserOut(u) as UserOut })
            }
        }

        if (!found) {
            res.status(404).json({ data: `user with id: ${userId} not found` })
        }

    } catch (error: any) {
        res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
});

router.post("/", async (req: Request, res: Response) => {
    const userIn = req.body as UserIn
    const users = await getUsers()
    const usersCtr = users.length
    let found = false

    for (let u of users) {
        if (u.email === userIn.email) {
            found = true
            res.status(400).json({ data: `user with email: ${userIn.email} already exists` })
        }
    }

    if (!found) {
        const user: User = {
            id: usersCtr + 1,
            created_at: Date.now(),
            last_login: -1,
            role_id: 1,
            name: userIn.name,
            email: userIn.email,
            password: userIn.password
        }
        users.push(user)

        try {
            await writeFile("./files/users.json", JSON.stringify(users))
            res.status(201).json({ data: getUserOut(user) as UserOut })
        } catch (error: any) {
            res.status(500).json({
                data: "internal server error",
                errorDetails: error.toString()
            })
        }
    }

});

router.delete("/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    try {
        const users = await getUsers()

        const filteredUsers = users.filter(u => {
            return u.id !== userId
        });

        if (users.length === filteredUsers.length) {
            res.status(400).json({ data: `user with id: ${userId} not found` })
        } else {
            await writeFile("./files/users.json", JSON.stringify(filteredUsers))
            res.status(204).send()
        }

    } catch (error: any) {
        res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
});

router.patch("/:id", async (req: Request, res: Response) => {
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
                res.status(400).json({ data: `cannot update ${nonUpdatableFields.join(" and ")} of the user` })
            } else {
                const userKeys = Object.getOwnPropertyNames(User)
                Object.keys(body).forEach(b => {
                    // NOTE: any workaround for this?: "email" | "password" | "name"

                    if (userKeys.includes(b)) {
                        filteredUser[b as "email" | "password" | "name"] = body[b as keyof UserIn]
                    }
                })
                users[userIndex] = filteredUser
                await writeFile("./files/users.json", JSON.stringify(users))
                res.status(200).send({ data: getUserOut(filteredUser) as UserOut })
            }
        } else {
            res.status(400).json({ data: `user with id: ${userId} not found` })
        }
    } catch (error: any) {
        res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
});

router.post("/reset-password", async (req: Request, res: Response) => {
    const { email } = req.query as { email: string }
    const { password } = req.body as { password: string }

    let users = await getUsers()
    const userIndex = users.map(u => u.email).indexOf(email)

    if (userIndex === -1) {
        res.status(404).json({ data: `user with email: ${email} not found` })
    } else {
        users[userIndex].password = password
        await writeFile("./files/users.json", JSON.stringify(users))
        res.status(201).send({ data: `password update successful for the user with email: ${email}` })
    }
})

module.exports = router;
