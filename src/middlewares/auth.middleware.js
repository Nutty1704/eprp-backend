import { NotAuthenticatedError } from "../lib/error-utils";

export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    throw NotAuthenticatedError.create();
}