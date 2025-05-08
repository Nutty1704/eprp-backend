import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Deal title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Deal type is required'],
        enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'FREE_ITEM', 'SET_MENU'], // Example types
    },
    // Value associated with the type (e.g., 15 for 15%, 10 for $10 off). Not always required (e.g., BOGO might not need it).
    discountValue: {
        type: Number,
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        index: true,
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        index: true,
    },
    // Status helps manage visibility and allows for future scheduling/automatic expiration
    status: {
        type: String,
        enum: ['ACTIVE', 'SCHEDULED', 'EXPIRED', 'INACTIVE'], // INACTIVE for manually disabled deals
        default: 'SCHEDULED',
        index: true,
    },
    redemptionInfo: {
        type: String,
        trim: true,
        default: "Show this deal in-store or mention when ordering.", // Example default
    },
    appliesTo: { // Describes what the deal covers
        type: String,
        trim: true,
    },
    minimumSpend: {
        type: Number,
        default: 0,
    },
    // --- Relationships ---
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        index: true,
    },
    // Store owner_id denormalized for easier authorization checks on update/delete
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true,
        index: true,
    },
}, { timestamps: true });

// Ensure end date is after start date (basic validation)
dealSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    // Automatically set initial status based on dates before first save
    if (this.isNew) {
        const now = new Date();
        if (this.startDate > now) {
            this.status = 'SCHEDULED';
        } else if (this.endDate < now) {
            this.status = 'EXPIRED'; // Should ideally not happen on create, but handles edge cases
        } else {
            // Only set to active if not manually set to INACTIVE
             if (this.status !== 'INACTIVE') {
                 this.status = 'ACTIVE';
             }
        }
    }
    next();
  }
});

dealSchema.index({ owner_id: 1, status: 1 });

const Deal = mongoose.model('Deal', dealSchema);

export default Deal;