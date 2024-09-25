import { Request, Response } from "express";
import { User } from "../models/user.model";

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

router.get("/", async (req: Request, res: Response) => {
    try {
        let users = await getUsers()
        res.json({ data: users })
    } catch (error: any) {
        res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        })
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    // assuming the userId will be integer parsable
    const userId = parseInt(req.params.id);
    try {
        const users = await getUsers()
        let found = false

        for (let u of users) {
            if (u.id === userId) {
                found = true
                res.json({ data: u })
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
    const { name, email, password } = req.body as { name: string, email: string, password: string }
    const users = await getUsers()
    const usersCtr = users.length
    let found = false

    for (let u of users) {
        if (u.email === email) {
            found = true
            res.status(400).json({ data: `user with email: ${email} already exists` })
        }
    }

    if (!found) {
        users.push({ id: usersCtr + 1, name, email, password })

        try {
            await writeFile("./files/users.json", JSON.stringify(users))
            res.status(201).json({ data: `user created successfully, user id: ${usersCtr + 1}` })
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

        const userIndex = users.map(u => u.id).indexOf(userId)
        const filteredUser: User = users[userIndex];

        if (filteredUser) {
            // TODO: write a logic to change update email and password of the user
            const nonUpdatableFields: string[] = Object.keys(req.body as { name: string, email: string, password: string }).filter(b => ["email", "password", "id"].includes(b))

            if (nonUpdatableFields.length !== 0) {
                res.status(400).json({ data: `cannot update ${nonUpdatableFields.join(" and ")} of the user` })
            } else {
                Object.keys(req.body as { name: string, email: string, password: string }).map(b => {
                    // NOTE: any workaround for this?: "email" | "password" | "name"
                    filteredUser[b as "email" | "password" | "name"] = req.body[b]
                })
                users[userIndex] = filteredUser
                await writeFile("./files/users.json", JSON.stringify(users))
                res.status(200).send({ data: filteredUser })
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

module.exports = router;
