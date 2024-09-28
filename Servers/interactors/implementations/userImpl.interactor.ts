import { IUserRepository } from "../../repositories/iUser.repository";
import { IUserInteractor } from "../iUser.interactor";
import { User400Exception, User404Exception, User500Exception } from "../../exceptions/user.excptions"

export class UserInteractor implements IUserInteractor {
    private repository: IUserRepository;

    constructor(repository: IUserRepository) {
        this.repository = repository
    }

    getAll() {
        return this.repository.getAll()
    }

    async getOne(id: number) {
        const user = await this.repository.getOne(id);
        if (user === undefined) {
            throw new User404Exception(`user with id: ${id} not found`)
        }
        return new Promise((resolve) => {
            resolve(user)
        })
    }
    async create(input: { name: string, email: string, password: string }) {
        const users = await this.repository.getAll()
        for (let u of users) {
            if (u.email === input.email) {
                throw new User400Exception(`user with email: ${input.email} already exists`)
            }
        }
        const body = { id: users.length + 1, ...input }
        return this.repository.create(body);
    }

    async delete(id: number) {
        const user = await this.repository.getOne(id);
        if (user === undefined) {
            throw new User404Exception(`user with id: ${id} not found`)
        }
        return this.repository.delete(id);
    }

    async update(id: number, input: { name?: string, email?: string, password?: string }) {
        const user = await this.repository.getOne(id);
        
        if (user === undefined) {
            throw new User404Exception(`user with id: ${id} not found`)
        }

        const nonUpdatableFields = Object.keys(input).filter(b => ["email", "password", "id"].includes(b))
        if (nonUpdatableFields.length !== 0) {
            throw new User400Exception(`cannot update ${nonUpdatableFields.join(" and ")} of the user`)
        }

        return this.repository.update(id, input);
    }

}