import passport from "passport";
import bcryptjs from "bcryptjs";
import User from "../models/user/user.model.js";
import { Strategy as LocalStrategy } from "passport-local";


passport.use(
    new LocalStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email });
                if (!user) {
                    return done(null, false, { message: "User not found" });
                }

                const isMatch = await bcryptjs.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: "Incorrect credentials" });
                }

                return done(null, user);
            } catch (error) {
                return done(err)
            }
        }
    )
);


// Store user id in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});


// Fetch user from id stored in session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(err);
    }
});


export default passport;