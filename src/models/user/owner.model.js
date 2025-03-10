import mongoose from "mongoose";
import User from "./user.model.js";

const OwnerSchema = new mongoose.Schema(
    {
        fname: {
            type: String,
        },
        lname: {
            type: String,
        },
        profile_image: {
            type: String,
            default: null
        },
    },
    { timestamps: true }
);

const Owner = User.discriminator("Owner", OwnerSchema);
export default Owner;