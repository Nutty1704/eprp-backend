import { NotAuthenticatedError } from "../lib/error-utils.js";

export const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create();
    next();
};

export const isCustomer = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create();
    
    if (req.user.userType !== 'customer') {
        throw new NotAuthenticatedError('Access restricted to customers only.');
    }

    req.customer = req.user;
    next();
};

export const isOwner = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create();

    if (req.user.userType !== 'owner') {
        throw new NotAuthenticatedError('Access restricted to owners only.');
    }

    req.owner = req.user;
    next();
};


export const optionalCustomer = (req, res, next) => {
    if (req.isAuthenticated() && req.user.userType === 'customer') {
        req.customer = req.user;
    }
    next();
}
