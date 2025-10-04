export type User = {
    id: number; //automatically created by database
    name: string; //will be filled by user
    surname: string; //will be filled by user
    email: string; //will be filled by user
    password_hash?: string; //created by the database
    roleId?: number; //will be filled by user
    created_at?: Date; //automatically filled by database
    last_login?: Date; //automatically filled by database
}