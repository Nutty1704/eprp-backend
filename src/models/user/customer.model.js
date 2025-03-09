import mongoose from "mongoose";
import User from "./User";

const CustomerSchema = new mongoose.Schema(
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

const Customer = User.discriminator("Customer", CustomerSchema);
export default Customer;