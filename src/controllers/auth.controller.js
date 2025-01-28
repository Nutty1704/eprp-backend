import bcryptjs from "bcryptjs";
import passport from "passport";

import User from "../models/user/user.model.js";
import { alreadyExists, isValidUserRole, createRoleEntity, fetchRoleEntity } from "../lib/user-helper.js";
import { parseValidationErrors, UserNotFoundError, NotAuthenticatedError, UserAlreadyExistsError, InvalidRoleError } from "../lib/error-utils.js";

// Utility function to authenticate and log in a user
const authenticateAndLogin = (req, res, next, user, role) => {
    req.login(user, async (err) => {
        try {
            if (err) throw err;

            // const { email, _id } = user;
            const roleEntity = await fetchRoleEntity(user, role);

            if (!roleEntity) {
                // Log the user out if the role entity is not found
                req.logout();
                UserNotFoundError.create();
            }

            const { email, _id } = user;

            switch (role) {

                case "customer":
                    const customer = {
                        name: roleEntity.name,
                        bio: roleEntity.bio,
                        review_count: roleEntity.review_count,
                        profile_image: roleEntity.profile_image,
                        user_id: roleEntity.user_id
                    }

                    return res.status(200).json({ success: true, message: "Logged in successfully", user: { email, _id }, customer });

                case "owner":
                    const owner = {
                        fname: roleEntity.fname,
                        lname: roleEntity.lname,
                        profile_image: roleEntity.profile_image,
                        user_id: roleEntity.user_id
                    }

                    return res.status(200).json({ success: true, message: "Logged in successfully", user: { email, _id }, owner });
            }

            // res.status(200).json({ success: true, message: "Logged in successfully", user: { email, _id } });

        } catch (error) {
            next(error);
        }
    });
};

export const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { role } = req.params;

        if (!isValidUserRole(role)) {
            throw InvalidRoleError.create();
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            const roleUserExists = await alreadyExists(existingUser, role);
            if (roleUserExists) {
                throw UserAlreadyExistsError.create();
            }

            // TOOD: Save the profile image on cloudinary
            await createRoleEntity(role, existingUser, req.body);

        } else {
            const hashedPassword = await bcryptjs.hash(password, 10);
            const newUser = new User({ email, password: hashedPassword });

            await newUser.save();
            await createRoleEntity(role, newUser, req.body);
        }

        // Log the user in automatically
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Internal server error during authentication" });
            }
            if (!user) {
                return res.status(401).json({ success: false, message: info.message });
            }
            authenticateAndLogin(req, res, next, user, role);
        })(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const login = (req, res, next) => {
    try {
        const { role } = req.params;

        if (!isValidUserRole(role)) {
            throw InvalidRoleError.create();
        }

        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
            if (!user) {
                return res.status(401).json({ success: false, message: info.message });
            }
            authenticateAndLogin(req, res, next, user, role);
        })(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res, next) => {
    try {
        if (!req.isAuthenticated()) {
            throw NotAuthenticatedError.create("No user is logged in.", 400);
        }

        req.logout(err => {
            if (err) {
                throw err
            }
            res.status(200).json({ success: true, message: "Logged out successfully" });
        });
    } catch (error) {
        next(error);
    }
};
