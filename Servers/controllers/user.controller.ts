import { Request, Response } from "express"
import { IUserInteractor } from "../interactors/iUser.interactor";
import { User400Exception, User404Exception } from "../exceptions/user.excptions";

export class UserController {
    private interactor: IUserInteractor;

    constructor(interactor: IUserInteractor) {
        this.interactor = interactor;
    }

    async getAllUsers(req: Request, res: Response) {
        const data = await this.interactor.getAll()
        return res.json(data)
    }
    async getUser(req: Request, res: Response) {
        // assuming the userId will be integer parsable
        const userId = parseInt(req.params.id);
        try {
            const user = await this.interactor.getOne(userId)
            res.json({ data: user })
        }
        catch (error) {
            if (error instanceof User404Exception) {
                res.status(404).json({ data: error.toString() })
            } else {
                res.status(500).json({
                    data: "internal server error",
                    errorDetails: error.toString()
                })
            }
        }
    }
    async createUser(req: Request, res: Response) {
        try {
            const user = await this.interactor.create(req.body)
            res.status(201).json({ data: user })

        } catch (error) {
            if (error instanceof User400Exception) {
                res.status(400).json({ data: error.toString() })
            } else {
                res.status(500).json({
                    data: "internal server error",
                    errorDetails: error.toString()
                })
            }
        }
    }
    async deleteUser(req: Request, res: Response) {
        const userId = parseInt(req.params.id);
        try {
            await this.interactor.delete(userId)
            res.status(204).send()
        } catch (error) {
            if (error instanceof User404Exception) {
                res.status(404).json({ data: error.toString() })
            } else {
                res.status(500).json({
                    data: "internal server error",
                    errorDetails: error.toString()
                })
            }
        }
    }
    async updateUser(req: Request, res: Response) {
        const userId = parseInt(req.params.id);
        try {
            const user = await this.interactor.update(userId, req.body)
            res.json(user)
        } catch (error) {
            if (error instanceof User404Exception) {
                res.status(404).json({ data: error.toString() })
            } else if (error instanceof User400Exception) {
                res.status(400).json({ data: error.toString() })
            } else {
                res.status(500).json({
                    data: "internal server error",
                    errorDetails: error.toString()
                })
            }
        }
    }
}