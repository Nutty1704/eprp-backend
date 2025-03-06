import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: function () { return !this.googleId; },
        },
        googleId: { 
            type: String, 
            unique: true, 
            sparse: true  // Allows some users to not have this field
        },
        name: {
            type: String, 
        },
        phone: {
            type: String,
        },
        roles: {
            type: Map,
            of: Object,  // Example: { customer: {}, owner: {} }
            default: {}
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
