export class STATUS_CODES {
    static 201 = (data: any) => { return { data } }
    static 200 = (data: any) => { return { data } }
    static 400 = (data: any) => { return { data } }
    static 404 = (k: string, v: any) => { return { data: `user with ${k}: ${v} not found` } };
    static 500 = (error: any) => {
        return {
            data: "internal server error",
            errorDetails: error.toString()
        }
    };
}