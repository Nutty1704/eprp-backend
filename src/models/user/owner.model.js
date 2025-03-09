import mongoose from "mongoose";
import User from "./User";

const OwnerSchema = new mongoose.Schema(
    {
        fname: {
            type: String,
            required: true,
        },
        lname: {
            type: String,
            required: true,
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