import passport from "passport";
import bcryptjs from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"

import User from "../models/user/user.model.js";
import Customer from "../models/user/customer.model.js";
import Owner from "../models/user/owner.model.js";

import { alreadyExists, createRoleEntity, isValidUserRole } from "./user-helper.js";

import dotenv from "dotenv";

dotenv.config();

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

// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: "/api/auth/google/callback",
//             scope: ["profile", "email"],
//             passReqToCallback: true, // Allows passing req to callback
//         },
//         async (req, accessToken, refreshToken, profile, cb) => {
//             try {
//                 const role = req.query.role; // Extract role from state parameter

//                 if (!role || (role !== "customer" && role !== "owner")) {
//                     return cb(new Error("Invalid role specified"));
//                 }

//                 // Check if the user exists in the database
//                 let user = await User.findOne({ email: profile.emails[0].value });

//                 if (user) {
//                     if (!alreadyExists(user, role)) {
//                         await createRoleEntity(role, user, {});
//                     }
//                 } else {
//                     // Create a new user
//                     user = new User({
//                         email: profile.emails[0].value,
//                         roles: { [role]: true },
//                         googleId: profile.id,
//                     });

//                     await user.save();
//                 }

//                 return cb(null, user);
//             } catch (error) {
//                 return cb(error);
//             }
//         }
//     )
// );


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
            return cb(new Error("Invalid role specified"));
          }
  
          // The rest of your code remains the same
          let user = await User.findOne({ email: profile.emails[0].value });
  
          if (user) {
            if (!alreadyExists(user, role)) {
              await createRoleEntity(role, user, {});
            }
          } else {
            user = new User({
              email: profile.emails[0].value,
              roles: { [role]: true },
              googleId: profile.id,
            });
  
            await user.save();
          }
  
          return cb(null, user);
        } catch (error) {
          return cb(error);
        }
      }
    )
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
