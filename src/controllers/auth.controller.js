import passport from "passport";

import { hashPassword } from "../lib/auth-utils.js";
import { InvalidRoleError, NotAuthenticatedError, UserAlreadyExistsError, UserNotFoundError } from "../lib/error-utils.js";
import { alreadyExists, createRoleEntity, isValidUserRole } from "../lib/user-helper.js";

import User from "../models/user/user.model.js";


export const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { role } = req.params;

        if (!isValidUserRole(role)) throw InvalidRoleError.create();

        let user = await User.findOne({ email });

        if (user) {
            // Check if the user already has this role
            const roleExists = await alreadyExists(user, role);
            if (roleExists) throw UserAlreadyExistsError.create();

            // User exists but doesn't have the requested role → Create role entity
            await createRoleEntity(role, user, req.body);
        } else {
            // User doesn't exist → Create user and role entity
            user = new User({ email, password: await hashPassword(password) });
            await user.save();
            await createRoleEntity(role, user, req.body);
        }

        // Authenticate and log the user in
        req.login(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ success: true, message: "Registered and logged in successfully" });
        });
    } catch (error) {
        next(error);
    }
};

export const login = (req, res, next) => {
    const { role } = req.params;

    if (!isValidUserRole(role)) {
        throw InvalidRoleError.create();
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info.message });

        // Extract the role entity from user.roles
        const roleEntity = user.roles?.[role.toLowerCase()];
        if (!roleEntity) {
            return next(UserNotFoundError.create("User does not have the requested role."));
        }

        req.login(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ 
                success: true, 
                message: "Logged in successfully", 
            });
        });
    })(req, res, next);
};

export const logout = (req, res, next) => {
    if (!req.isAuthenticated()) throw NotAuthenticatedError.create("No user is logged in.", 400);

    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ success: true, message: "Logged out successfully" });
    });
};
