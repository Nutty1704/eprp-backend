import mongoose from "mongoose";


const ownerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
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
        type: String
    }
});


const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;