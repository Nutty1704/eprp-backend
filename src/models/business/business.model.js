import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
  );

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, required: true },
    rating: { type: Number, default: 0 },
    foodRating: { type: Number, default: 0 },
    serviceRating: { type: Number, default: 0 },
    ambienceRating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    images: { type: Array, default: [] },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    price_range_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PriceRange',
    },
    menuItems: [menuItemSchema],
    cuisines: [{ type: String, required: true }],

}, { timestamps: true });

businessSchema.index({ owner: 1 });
businessSchema.index({ name: 1, owner: 1 }, { unique: true });

const businessModel = mongoose.model('Business', businessSchema);

export default businessModel;