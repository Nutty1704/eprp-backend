import passport from "passport";
import bcryptjs from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";

import User from "../models/user/user.model.js";
import Customer from "../models/user/customer.model.js";
import Owner from "../models/user/owner.model.js";


// Local Strategy for authenticating users
passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) return done(null, false, { message: "User not found" });

            const isMatch = await bcryptjs.compare(password, user.password);
            if (!isMatch) return done(null, false, { message: "Incorrect credentials" });

            const roles = await fetchUserRoles(user._id);

            if (Object.keys(roles).length === 0) {
                return done(null, false, { message: "User role entity not found" });
            }

            return done(null, { ...user.toObject(), roles }); // Attach roles
        } catch (error) {
            return done(error);
        }
    })
);

// Store user ID in session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (!user) return done(null, false);

        const roles = await fetchUserRoles(id);

        done(null, { ...user.toObject(), roles });
    } catch (error) {
        done(error);
    }
});


// helper function

const fetchUserRoles = async (userId) => {
    const customer = await Customer.findOne({ user_id: userId });
    const owner = await Owner.findOne({ user_id: userId });

    return {
        ...(customer && { customer }),
        ...(owner && { owner }),
    };
};

export default passport;
