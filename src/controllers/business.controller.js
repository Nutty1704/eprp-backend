import Business from "../models/business/business.model.js";
import Owner from "../models/user/owner.model.js";
import cloudinary from "cloudinary";

// Get all businesses for the logged-in owner
export const getMyBusinesses = async (req, res) => {
  try {
    // Get the owner document from the owner middleware
    const owner = req.owner;
    const businesses = await Business.find({ owner_id: owner._id });
    
    res.status(200).json(businesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ message: "Error fetching businesses" });
  }
};

// Get a specific business by ID (ensuring it belongs to the logged-in owner)
export const getMyBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;
    const owner = req.owner;
    
    const business = await Business.findOne({ 
      _id: businessId,
      owner_id: owner._id 
    });
    
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    res.status(200).json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ message: "Error fetching business" });
  }
};

// Create a new business
export const createBusiness = async (req, res) => {
  try {
    const owner = req.owner;
    
    // Check if a business with this name already exists for this owner
    const existingBusiness = await Business.findOne({ 
      name: req.body.name,
      owner_id: owner._id 
    });

    if (existingBusiness) {
      return res.status(409).json({ message: "You already have a business with this name" });
    }

    // Handle image upload if exists
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    // Create new business
    const business = new Business({
      ...req.body,
      owner_id: owner._id,
      imageUrl: imageUrl
    });
    
    await business.save();
    
    res.status(201).json(business);
  } catch (error) {
    console.error("Error creating business:", error);
    res.status(500).json({ message: "Error creating business" });
  }
};

// Update an existing business
export const updateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const owner = req.owner;
    
    // Find the business and ensure it belongs to the owner
    const business = await Business.findOne({
      _id: businessId,
      owner_id: owner._id
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Update business fields
    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        business[key] = updates[key];
      }
    });

    // Handle image upload if exists
    if (req.file) {
      const imageUrl = await uploadImage(req.file);
      business.imageUrl = imageUrl;
    }

    business.lastUpdated = new Date();
    await business.save();
    
    res.status(200).json(business);
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({ message: "Error updating business" });
  }
};

// Delete a business
export const deleteBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const owner = req.owner;
    
    const result = await Business.findOneAndDelete({
      _id: businessId,
      owner_id: owner._id
    });
    
    if (!result) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    res.status(200).json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error("Error deleting business:", error);
    res.status(500).json({ message: "Error deleting business" });
  }
};

// Helper function for image upload
const uploadImage = async (file) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  getMyBusinesses,
  getMyBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};