import Business from "../models/business/business.model.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import mongoose from "mongoose";
import { EntityNotFoundError } from "../lib/error-utils.js";
import BusinessStats from "../models/business/business_stats.model.js";

// Get all businesses for the logged-in owner
export const getMyBusinesses = async (req, res) => {
  try {
    // Get the owner document from the owner middleware
    const owner = req.owner;
    
    // Find businesses with this owner
    const businesses = await Business.find({ owner_id: owner._id });
    
    res.status(200).json(businesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ message: "Error fetching businesses" });
  }
};

// Get a specific business by ID (ensuring it belongs to the logged-in owner)
export const getBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findOne({ 
      _id: businessId,
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
    
    // Prepare business data
    const businessData = {
      name: req.body.businessName || req.body.name,
      businessName: req.body.businessName || req.body.name,
      description: req.body.description || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      website: req.body.website || "",
      address: req.body.address,
      owner_id: owner._id
    };
    
    // Parse opening hours if provided
    if (req.body.openingHours) {
      try {
        businessData.openingHours = JSON.parse(req.body.openingHours);
      } catch (e) {
        console.error("Error parsing opening hours:", e);
      }
    }
    
    // Parse cuisines if provided
    if (req.body.cuisines) {
      try {
        businessData.cuisines = Array.isArray(req.body.cuisines) 
          ? req.body.cuisines 
          : JSON.parse(req.body.cuisines);
        
        // Ensure cuisines is always an array
        if (!Array.isArray(businessData.cuisines)) {
          businessData.cuisines = [];
        }
      } catch (e) {
        console.error("Error parsing cuisines:", e);
        businessData.cuisines = [];
      }
    } else {
      businessData.cuisines = [];
    }
    
    // Check if a business with this name already exists for this owner
    const existingBusiness = await Business.findOne({ 
      name: businessData.name,
      owner_id: owner._id 
    });

    if (existingBusiness) {
      return res.status(409).json({ message: "You already have a business with this name" });
    }

    // Handle image upload if exists
    if (req.files?.profile_image?.[0]) {
      const imageFile = req.files.profile_image[0];
      const imageUrl = await uploadImage(imageFile);
      businessData.imageUrl = imageUrl;
    }

    if (req.files?.business_images?.length) {
      const businessUrls = await Promise.all(
        req.files.business_images.map(file => uploadImage(file))
      );
      businessData.images = businessUrls;
    }

    // Create new business
    const business = new Business(businessData);
    await business.save();
    
    res.status(201).json(business);
  } catch (error) {
    console.error("Error creating business:", error);
    res.status(500).json({ message: "Error creating business", error: error.message });
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
    if (req.body.businessName) {
      business.businessName = req.body.businessName;
      business.name = req.body.businessName;
    }
    if (req.body.name) business.name = req.body.name;
    if (req.body.description !== undefined) business.description = req.body.description;
    if (req.body.email !== undefined) business.email = req.body.email;
    if (req.body.phone !== undefined) business.phone = req.body.phone;
    if (req.body.website !== undefined) business.website = req.body.website;
    if (req.body.address) business.address = req.body.address;

    // Parse opening hours if provided
    if (req.body.openingHours) {
      try {
        business.openingHours = JSON.parse(req.body.openingHours);
      } catch (e) {
        console.error("Error parsing opening hours:", e);
      }
    }
    
    // Parse cuisines if provided
    if (req.body.cuisines) {
      try {
        business.cuisines = Array.isArray(req.body.cuisines) 
          ? req.body.cuisines 
          : JSON.parse(req.body.cuisines);
        
        // Ensure cuisines is always an array
        if (!Array.isArray(business.cuisines)) {
          business.cuisines = [];
        }
      } catch (e) {
        console.error("Error parsing cuisines:", e);
      }
    } else {
      // Empty array if no cuisines provided (to clear existing cuisines)
      business.cuisines = [];
    }

    // Parse menu items if provided
    if (req.body.menuItems) {
      try {
        let menuItems = JSON.parse(req.body.menuItems);

        menuItems = menuItems.map(item => {
          if (!item._id || typeof item._id !== 'string' || item._id.startsWith('temp-')) {
            return { ...item, _id: new mongoose.Types.ObjectId() };
          }
          return item;
        });
        
        // Ensure menu items is always an array
        if (Array.isArray(menuItems)) {
          business.menuItems = menuItems;
        }
      } catch (e) {
        console.error("Error parsing menu items:", e);
      }
    }

    if (req.body.profileImageDeleted === "true") {
      business.imageUrl = null;
    } else if (req.files?.profile_image?.[0]) {
      const imageFile = req.files?.profile_image?.[0];
      const imageUrl = await uploadImage(imageFile);
      business.imageUrl = imageUrl;
    }

    let updatedGallery = business.images || [];

    // Remove any deleted URLs
    if (req.body.removedImageUrls) {
      let removed = [];
      try {
        removed = JSON.parse(req.body.removedImageUrls);
      } catch (e) {
        console.error("Error parsing removed image URLs:", e);
      }
      if (Array.isArray(removed)) {
        updatedGallery = updatedGallery.filter(url => !removed.includes(url));
      }
    }
    
    // Upload and append new images
    if (req.files?.business_images?.length) {
      const newUrls = await Promise.all(
        req.files.business_images.map(file => uploadImage(file))
      );
      updatedGallery.push(...newUrls);
    }
    
    // Save back to business
    business.images = updatedGallery;

    // Handle menu item image upload
    if (req.files?.menuItemImage || req.body.menuItemImage) {
      const imageFile = req.files?.menuItemImage?.[0] || req.body.menuItemImage;
      const menuItemIndex = parseInt(req.body.menuItemImageIndex);
      
      if (!isNaN(menuItemIndex) && imageFile && business.menuItems[menuItemIndex]) {
        const imageUrl = await uploadImage(imageFile);
        business.menuItems[menuItemIndex].imageUrl = imageUrl;
      }
    }

    business.lastUpdated = new Date();
    await business.save();
    
    res.status(200).json(business);
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({ message: "Error updating business", error: error.message });
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


export const getBusinessStats = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const owner = req.owner;
    
    const business = await Business.findOne({ 
      _id: businessId,
      owner_id: owner._id
    });
    
    if (!business) {
      return next(new EntityNotFoundError("Business not found"));
    }

    stats = await BusinessStats.findOne({ 
      businessId: business._id
    });

    if (!stats) {
      stats = new BusinessStats({
        businessId: business._id
      });
      await stats.save();
    }
    
    res.status(200).json({ success: true, error: false, data: stats });
  } catch (error) {
    next(error);
  }
}

export const getPopularBusinesses = async (req, res) => {
  try {
    // Get query parameters or set defaults
    const limit = parseInt(req.query.limit) || 6; // Default to 6 businesses
    const ratingWeight = 0.7; // Weight for rating (W1)
    const reviewCountWeight = 0.3; // Weight for review count (W2)

    // --- Aggregation Pipeline ---
    const pipeline = [
      // Add the popularity score field
      {
        $addFields: {
          // Calculate log(review_count + 1) to handle 0 reviews and normalize
          logReviewCount: { $ln: { $add: ["$review_count", 1] } }, 
        }
      },
      {
         $addFields: {
            popularityScore: {
                $add: [
                  { $multiply: ["$rating", ratingWeight] },
                  { $multiply: ["$logReviewCount", reviewCountWeight] }
                ]
            }
         }
      },
      // Sort by the calculated popularity score (descending)
      {
        $sort: {
          popularityScore: -1
        }
      },
      // Limit the number of results
      {
        $limit: limit
      },
      // Project only necessary fields (improves performance)
      {
        $project: {
            // Include fields needed by RestaurantCard
            name: 1,
            address: 1,
            rating: 1,
            review_count: 1,
            imageUrl: 1,
            cuisines: 1,
            openingHours: 1, 
            _id: 1,
        }
      }
    ];

    // Execute aggregation
    const popularBusinesses = await Business.aggregate(pipeline);

    res.status(200).json(popularBusinesses);

  } catch (error) {
    console.error("Error fetching popular businesses:", error);
    res.status(500).json({ message: "Error fetching popular businesses" });
  }
};

// Helper function for image upload
const uploadImage = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Read the file from disk
  const fileData = await fs.readFile(file.path);

  const base64Image = fileData.toString("base64");
  const dataURI = `data:${file.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  getMyBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessStats
  getPopularBusinesses,
};