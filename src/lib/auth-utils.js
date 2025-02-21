import bcryptjs from "bcryptjs";

import { fetchRoleEntity } from "./user-helper.js";
import { UserNotFoundError } from "./error-utils.js";

// Authenticate and log in a user
export const authenticateAndLogin = (req, res, next, user, role) => {
    req.login(user, async (err) => {
        try {
            if (err) throw err;

            const roleEntity = await fetchRoleEntity(user, role);
            if (!roleEntity) {
                req.logout();
                throw UserNotFoundError.create();
            }

            const { email, _id } = user;
            const roleData = role === "customer"
                ? { name: roleEntity.name, bio: roleEntity.bio, review_count: roleEntity.review_count, profile_image: roleEntity.profile_image, user_id: roleEntity.user_id }
                : { fname: roleEntity.fname, lname: roleEntity.lname, profile_image: roleEntity.profile_image, user_id: roleEntity.user_id };

            return res.status(200).json({ success: true, message: "Logged in successfully", user: { email, _id }, [role]: roleData });
        } catch (error) {
            next(error);
        }
    });
};

// Hash password
export const hashPassword = async (password) => {
    return await bcryptjs.hash(password, 10);
};
