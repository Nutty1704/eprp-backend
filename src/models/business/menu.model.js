import mongoose from "mongoose";


const menuSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    }]
});


const Menu = mongoose.model('Menu', menuSchema);

export default Menu;