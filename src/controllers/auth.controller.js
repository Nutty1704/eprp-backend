import passport from "passport";
import { hashPassword } from "../lib/auth-utils.js";
import { InvalidRoleError, NotAuthenticatedError, UserAlreadyExistsError, UserNotFoundError } from "../lib/error-utils.js";
import { alreadyExists, createRoleEntity, isValidUserRole } from "../lib/user-helper.js";
import User from "../models/user/user.model.js";


export const getAuthStatus = async (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        return res.status(200).json({
            isAuthenticated: true,
            user: {
                _id: req.user._id,
                email: req.user.email,
                roles: req.user.roles
            }
        })
    } else {
        return res.status(200).json({
            isAuthenticated: false,
            user: null
        });
    }
}

export const register = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!isValidUserRole(role)) throw InvalidRoleError.create();

        let user = await User.findOne({ email });

        if (user) {
            // Check if the user already has this role
            const roleExists = await alreadyExists(user, role);
            if (roleExists) throw UserAlreadyExistsError.create();

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
            return res.status(200).json({ success: true, message: "Registered and logged in successfully", user });
        });
    } catch (error) {
        next(error);
    }
};

export const login = (req, res, next) => {
    const { role } = req.body;

    if (role && !isValidUserRole(role)) {
        return next(InvalidRoleError.create());
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info.message });

        if (role) {
            const roleEntity = user.roles?.[role.toLowerCase()];
            if (!roleEntity) {
                return next(UserNotFoundError.create("User does not have the requested role."));
            }
        }

        req.login(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ success: true, message: "Logged in successfully", user });
        });
    })(req, res, next);
};

export const logout = (req, res, next) => {
    const sessionId = req.sessionID; // Correctly get session ID

    req.logout((err) => {
        if (err) return next(err);

        req.sessionStore.destroy(sessionId, (destroyErr) => {
            if (destroyErr) {
                console.error("Error destroying session from MongoDB:", destroyErr);
                return next(destroyErr);
            }

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            req.session = null;

            res.status(200).json({ success: true, message: "Logged out successfully" });
        });
    });
};

// Google OAuth Login/Signup
export const googleAuth = (req, res, next) => {
    const role = req.query.role;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: role
    })(req, res, next);
};

// Google OAuth Callback
export const googleCallback = (req, res, next) => {
    passport.authenticate(
        'google',
        { 
            failureRedirect: '/api/auth/login/failed',
            passReqToCallback: true
        }
    )(req, res, function(err) {
        if (err) return next(err);
        
        // After successful authentication, redirect to frontend
        req.login(req.user, (err) => {
            if (err) return next(err);
            res.redirect(`${process.env.FRONTEND_URL}/`);
        });
    });
};


export const loginFailed = (req, res, next) => {
    res.status(401).json({
        success: false,
        error: true,
        message: "Login failed."
    });
}