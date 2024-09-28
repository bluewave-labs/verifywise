export class User400Exception extends Error{
    constructor(msg: string) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, User400Exception.prototype);
    }
}

export class User404Exception extends Error{
    constructor(msg: string) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, User404Exception.prototype);
    }
}

export class User500Exception extends Error{
    constructor(msg: string) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, User500Exception.prototype);
    }
}