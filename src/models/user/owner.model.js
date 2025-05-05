import mongoose from "mongoose";


const ownerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    profile_image: {
        type: String,
        default: null
    }
}, { timestamps: true });


const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;