import {User} from "../models/user.model"

export interface IUserRepository {
    getAll(): Promise<User[]>;
    getOne(id: number): Promise<User | undefined>;
    create(input: User): Promise<User>;
    delete(id: number): Promise<number>;
    update(id: number, input: any): Promise<User>;
}