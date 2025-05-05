import passport from "passport";
import { hashPassword } from "../lib/auth-utils.js";
import { InvalidRoleError, NotAuthenticatedError, UserAlreadyExistsError, UserNotFoundError } from "../lib/error-utils.js";
import Customer from "../models/user/customer.model.js";
import Owner from "../models/user/owner.model.js";

// Helper function to get the appropriate model based on role
const getUserModel = (role) => {
  return role === 'customer' ? Customer : Owner;
};

// Helper to validate role
const isValidUserRole = (role) => {
  return role === 'customer' || role === 'owner';
};

export const getAuthStatus = async (req, res, next) => {
  const { role } = req.query;

  if (!role || !isValidUserRole(role)) {
    return next(new InvalidRoleError());
  }

  if (req.isAuthenticated() && req.user && req.user.userType === role) {
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        userType: req.user.userType
      }
    });
  } else {
    return res.status(200).json({
      isAuthenticated: false,
      user: null
    });
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, role, ...additionalData } = req.body;

    if (!isValidUserRole(role)) throw InvalidRoleError.create();

    // Check if user already exists in the specified role collection
    const UserModel = getUserModel(role);
    let existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      throw UserAlreadyExistsError.create();
    }

    // Create new user in appropriate model
    let userData = { 
      email, 
      password: await hashPassword(password),
      ...additionalData
    };

    // Add role-specific required fields if not provided
    if (role === 'owner') {
      if (!userData.fname) userData.fname = userData.name || 'New';
      if (!userData.lname) userData.lname = 'Owner';
    }

    const newUser = new UserModel(userData);
    await newUser.save();

    // Add userType to returned user object
    const user = newUser.toObject();
    user.userType = role;

    // Authenticate and log the user in
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ 
        success: true, 
        message: "Registered and logged in successfully", 
        user 
      });
    });
  } catch (error) {
    next(error);
  }
};

export const login = (req, res, next) => {
  const { role } = req.body;

  if (!role || !isValidUserRole(role)) {
    return next(InvalidRoleError.create());
  }

  // Add role to request body for passport local strategy
  req.body.role = role;

  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new NotAuthenticatedError("Invalid credentials."));

    // Check if returned user matches requested role
    if (user.userType !== role) {
      return next(new UserNotFoundError("User does not have the requested role."));
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ 
        success: true, 
        message: "Logged in successfully", 
        user 
      });
    });
  })(req, res, next);
};

export const logout = (req, res, next) => {
  const sessionId = req.sessionID;

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

  if (!role || !isValidUserRole(role)) {
    return next(new InvalidRoleError());
  }

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
};