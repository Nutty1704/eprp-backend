import Deal from '../models/business/deal.model.js';
import Business from '../models/business/business.model.js'; // Needed to verify ownership on create
import mongoose from 'mongoose';

// --- Create a new Deal (Owner) ---
export const createDeal = async (req, res) => {
    try {
        const ownerId = req.owner._id; // Assuming isOwner middleware attaches owner doc
        const { business_id, ...dealData } = req.body;

        if (!business_id || !mongoose.Types.ObjectId.isValid(business_id)) {
            return res.status(400).json({ message: "Valid Business ID is required." });
        }

        // **Authorization Check:** Verify the authenticated owner owns the target business
        const business = await Business.findOne({ _id: business_id, owner_id: ownerId });
        if (!business) {
            return res.status(403).json({ message: "Forbidden: You do not own this business or it doesn't exist." });
        }

        // Create the deal, associating owner and business
        const newDeal = new Deal({
            ...dealData,
            business_id: business_id,
            owner_id: ownerId,
        });

        // Basic validation (dates) runs via pre-save hook in model

        await newDeal.save();
        res.status(201).json(newDeal);

    } catch (error) {
        console.error("Error creating deal:", error);
        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Error creating deal", error: error.message });
    }
};

// --- Get Active/Upcoming Deals for a Specific Business (Public) ---
export const getDealsForBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ message: "Invalid Business ID." });
        }

        const now = new Date();

        // Find deals that are ACTIVE or SCHEDULED and not yet ended
        const deals = await Deal.find({
            business_id: businessId,
            status: { $in: ['ACTIVE', 'SCHEDULED'] },
            endDate: { $gte: now } // Only show deals that haven't ended
        }).sort({ startDate: 1 }); // Sort by start date, for example

        res.status(200).json(deals);

    } catch (error) {
        console.error("Error fetching deals for business:", error);
        res.status(500).json({ message: "Error fetching deals", error: error.message });
    }
};

// --- Get ALL Deals for the Authenticated Owner (Owner Dashboard) ---
export const getMyDeals = async (req, res) => {
    try {
        const ownerId = req.owner._id;

        // Find all deals linked to this owner
        const deals = await Deal.find({ owner_id: ownerId })
            .populate('business_id', 'name address') // Optionally populate business name/address
            .sort({ createdAt: -1 }); // Show newest first, for example

        res.status(200).json(deals);

    } catch (error) {
        console.error("Error fetching owner's deals:", error);
        res.status(500).json({ message: "Error fetching your deals", error: error.message });
    }
};

// --- Update a Deal (Owner) ---
export const updateDeal = async (req, res) => {
    try {
        const { dealId } = req.params;
        const ownerId = req.owner._id;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(dealId)) {
            return res.status(400).json({ message: "Invalid Deal ID." });
        }

        // **Authorization Check:** Find the deal and verify ownership directly
        const deal = await Deal.findById(dealId);

        if (!deal) {
            return res.status(404).json({ message: "Deal not found." });
        }

        if (!deal.owner_id.equals(ownerId)) {
            return res.status(403).json({ message: "Forbidden: You do not own this deal." });
        }

        // Prevent changing ownership details via update
        delete updateData.owner_id;
        delete updateData.business_id;

        // Apply updates
        Object.assign(deal, updateData);

        // Re-run validation and pre-save hooks (like date check, status logic)
        const updatedDeal = await deal.save();

        res.status(200).json(updatedDeal);

    } catch (error) {
        console.error("Error updating deal:", error);
         if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Error updating deal", error: error.message });
    }
};

// --- Delete a Deal (Owner) ---
export const deleteDeal = async (req, res) => {
    try {
        const { dealId } = req.params;
        const ownerId = req.owner._id;

        if (!mongoose.Types.ObjectId.isValid(dealId)) {
            return res.status(400).json({ message: "Invalid Deal ID." });
        }

        // **Authorization Check:** Find the deal first to verify ownership
        const deal = await Deal.findById(dealId);

        if (!deal) {
            return res.status(404).json({ message: "Deal not found." });
        }

        if (!deal.owner_id.equals(ownerId)) {
            return res.status(403).json({ message: "Forbidden: You do not own this deal." });
        }

        // Perform the delete
        await Deal.findByIdAndDelete(dealId);

        res.status(200).json({ message: "Deal deleted successfully." });

    } catch (error) {
        console.error("Error deleting deal:", error);
        res.status(500).json({ message: "Error deleting deal", error: error.message });
    }
};

export default {
    createDeal,
    getDealsForBusiness,
    getMyDeals,
    updateDeal,
    deleteDeal
};