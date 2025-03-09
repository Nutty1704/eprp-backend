import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        auth0Id: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String, 
        },
        phone: {
            type: String,
        },
        role: {
            type: String,
            required: true,
            enum: ["Customer", "Owner"], 
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;