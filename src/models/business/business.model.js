import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
  );

// Schema for a single time slot
const timeSlotSchema = new mongoose.Schema({
  open: { type: String, required: true },
  close: { type: String, required: true }
}, { _id: false });

// Schema for a day's operating hours
const dayHoursSchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: false },
  timeSlots: [timeSlotSchema]
}, { _id: false });



const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, required: true },
    location: {
      type: {
          type: String,
          enum: ['Point'], // Only 'Point' type for coordinates
          // required: true // Make required once geocoding is implemented
      },
      coordinates: {
          type: [Number], // Array of [longitude, latitude]
          // required: true // Make required once geocoding is implemented
      }
  },
    rating: { type: Number, default: 0 },
    foodRating: { type: Number, default: 0 },
    serviceRating: { type: Number, default: 0 },
    ambienceRating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    website: { type: String, default: ""},
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
    // Opening hours for each day of the week
    openingHours: {
      mon: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      tue: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      wed: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      thu: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      fri: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      sat: { type: dayHoursSchema, default: () => ({ isOpen: true, timeSlots: [{ open: "10:00", close: "20:00" }] }) },
      sun: { type: dayHoursSchema, default: () => ({ isOpen: false, timeSlots: [] }) }
    },
}, { timestamps: true });

// Geospatial index for location-based queries
// This MUST be created after you start populating the 'location.coordinates' field.
businessSchema.index({ location: '2dsphere' });

businessSchema.index({ owner_id: 1 }); // Changed from 'owner' to 'owner_id'
businessSchema.index({ name: 1, owner_id: 1 }, { unique: true });

// Pre-save middleware to sync name and businessName
businessSchema.pre('save', function(next) {
  if (this.businessName && !this.name) {
    this.name = this.businessName;
  } else if (this.name && !this.businessName) {
    this.businessName = this.name;
  }
  next();
});

const businessModel = mongoose.model('Business', businessSchema);

export default businessModel;