// User model
export class User {
    constructor(
        public id: number,
        public name: string,
        public email: string,
        public password: string,
        public created_at: number,
        public last_login: number,
        public role_id: number
    ) { }
}