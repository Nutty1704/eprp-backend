import passport from "passport";
import bcryptjs from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import Customer from "../models/user/customer.model.js";
import Owner from "../models/user/owner.model.js";

import { InvalidRoleError } from "./error-utils.js";
import dotenv from "dotenv";

dotenv.config();

// Local Strategy with role specification
passport.use(
  new LocalStrategy(
    { 
      usernameField: "email",
      passReqToCallback: true  // Allow access to request object
    }, 
    async (req, email, password, done) => {
      try {
        // Get role from request
        const role = req.body.role;
        
        if (!role || (role !== "customer" && role !== "owner")) {
          return done(null, false, { message: "Invalid role specified" });
        }
        
        // Query the appropriate collection based on role
        const UserModel = role === "customer" ? Customer : Owner;
        const user = await UserModel.findOne({ email });
        
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        
        // Verify password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect credentials" });
        }
        
        // Add role information to the user object
        return done(null, { ...user.toObject(), userType: role });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google Strategy with role specification from state parameter
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, cb) => {
      try {
        // Extract role from state parameter
        const role = req.query.state;
        if (!role || (role !== "customer" && role !== "owner")) {
          return cb(new InvalidRoleError());
        }

        const email = profile.emails[0].value;
        const googleId = profile.id;
        
        // Use appropriate model based on role
        const UserModel = role === "customer" ? Customer : Owner;
        
        // Check if user exists in the specified role collection
        let user = await UserModel.findOne({ $or: [{ email }, { googleId }] });
        
        if (!user) {
          // Create new user in appropriate collection
          if (role === "customer") {
            user = new Customer({
              email,
              googleId,
              name: profile.displayName || "",
            });
          } else { // owner
            user = new Owner({
              email,
              googleId,
              fname: profile.name.givenName || "",
              lname: profile.name.familyName || "",
            });
          }
          await user.save();
        } else if (!user.googleId) {
          // Link google account to existing email-based account
          user.googleId = googleId;
          await user.save();
        }

        // Add role information
        return cb(null, { ...user.toObject(), userType: role });
      } catch (error) {
        return cb(error);
      }
    }
  )
);

// Serialize user - store userType alongside the ID
passport.serializeUser((user, done) => {
  done(null, {
    id: user._id,
    userType: user.userType
  });
});

// Deserialize user - load from appropriate collection based on userType
passport.deserializeUser(async (serialized, done) => {
  try {
    const { id, userType } = serialized;
    
    // Use appropriate model based on userType
    const UserModel = userType === "customer" ? Customer : Owner;
    const user = await UserModel.findById(id);

    if (!user) {
      return done(null, false);
    }

    // Add userType to the deserialized object
    done(null, { ...user.toObject(), userType });
  } catch (error) {
    done(error);
  }
});

export default passport;