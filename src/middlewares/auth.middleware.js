import { NotAuthenticatedError, InvalidRoleError } from "../lib/error-utils.js";

export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    throw NotAuthenticatedError.create();
};

export const isCustomer = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create();
    if (!req.user.roles.customer) throw InvalidRoleError.create("Access restricted to customers only");

    req.customer = req.user.roles.customer; // Directly attach the customer role
    next();
};

export const isOwner = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create();
    if (!req.user.roles.owner) throw InvalidRoleError.create("Access restricted to owners only");

    req.owner = req.user.roles.owner; // Directly attach the owner role
    next();
};

