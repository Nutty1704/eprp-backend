import bcryptjs from "bcryptjs";
import User from "../models/user/user.model.js";
import passport from "passport";

export const register = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
            if (!user) {
                return res.status(401).json({ success: false, message: info.message });
            }

            req.login(user, err => {
                if (err) {
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }

                const { email, _id } = user;
                res.status(201).json({ success: true, message: "User created and logged in successfully", user: { email, _id } });
            });
        })(req, res, next);

    } catch (error) {
        console.log("Error in user registration controller: ", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


export const login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: info.message });
        }

        req.login(user, err => {
            if (err) {
                return res.status(500).json({ success: false, message: "Internal server error" });
            }

            const { email, _id } = user;
            res.status(200).json({ success: true, message: "Logged in successfully", user: { email, _id } });
        })
    })(req, res, next);
}


export const logout = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(400).json({ success: false, message: "User is not logged in" });
    }

    req.logout(err => {
        if (err) return res.status(500).json({ success: false, message: "Internal server error" });
        res.json({ success: true, message: "Logged out successfully" });
    });
}