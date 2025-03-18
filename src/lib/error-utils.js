export const parseValidationErrors = (error) => {
    if (error.name === "ValidationError") {
        return Object.values(error.errors).map(err => err.message);
    }
    return ["An unknown error occurred."];
};


class ErrorWithStatus extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.isCustom = true;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class InvalidRoleError extends ErrorWithStatus {
    constructor() {
        super("Invalid role. It must be either 'customer' or 'owner'.", 400);
    }

    static create() {
        return new InvalidRoleError();
    }
}


export class UserNotFoundError extends ErrorWithStatus {
    constructor(message = "User not found.") {
        super(message, 404);
    }

    static create() {
        return new UserNotFoundError();
    }
}


export class UserAlreadyExistsError extends ErrorWithStatus {
    constructor() {
        super("User with this email already exists.", 400);
    }

    static create() {
        return new UserAlreadyExistsError();
    }
}


export class NotAuthenticatedError extends ErrorWithStatus {
    constructor(message, status = 401) {
        super(message, status);
    }

    static create(message = "User is not authenticated.", status = 401) {
        return new NotAuthenticatedError(message, status);
    }
}


export class InvalidDataError extends ErrorWithStatus {
    constructor (message) {
        super(message, 400);
    }
}


export class EntityNotFoundError extends ErrorWithStatus {
    constructor(message) {
        super(message, 404);
    }
}