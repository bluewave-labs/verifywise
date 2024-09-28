export interface IUserInteractor {
    getAll();
    getOne(id: number);
    create(input: any);
    delete(id: number);
    update(id: number, input: any);
}