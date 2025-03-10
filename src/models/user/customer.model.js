import mongoose from "mongoose";
import User from "./user.model.js";

const CustomerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        bio: {
            type: String,
        },
        profile_image: {
            type: String,
            default: null
        },
    },
    { timestamps: true }
);

const Customer = User.discriminator("Customer", CustomerSchema);
export default Customer;