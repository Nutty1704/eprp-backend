import mongoose from "mongoose";


const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ""
    }
}, { timestamps: true });


const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;