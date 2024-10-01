export class UserOut {
    constructor(
        public id: number,
        public name: string,
        public email: string,
        public created_at: string,
        public last_login: string,
    ) { }
}