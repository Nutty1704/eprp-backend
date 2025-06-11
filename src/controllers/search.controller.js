import Business from "../models/business/business.model.js";

// Search businesses by name or cuisine or both
export const searchBusinesses = async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery || "";
    const selectedCuisines = req.query.selectedCuisines || "";
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortOption = req.query.sortOption || "createdAt";
    
    let query = {};
    let conditions = [];
    
    // Add search by name or cuisine if searchQuery is provided
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      conditions.push({
        "$or": [
          { name: searchRegex },
          { cuisines: { $in: [searchRegex] } }
        ]
      });
    }
    
    // Add filter by cuisine if selectedCuisines is provided
    if (selectedCuisines) {
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine.trim(), "i"));
      
      conditions.push({ cuisines: { $all: cuisinesArray } });
    }
    
    // Combine all conditions with $and if there are any
    if (conditions.length > 0) {
      query = { $and: conditions };
    }
    
    const skip = (page - 1) * pageSize;
    
    const businesses = await Business.find(query)
      .sort({ [sortOption]: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const total = await Business.countDocuments(query);
    
    res.status(200).json({
      data: businesses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error searching businesses:", error);
    res.status(500).json({ message: "Error searching businesses" });
  }
};

// Get business by ID (for public access)
export const getBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    res.status(200).json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ message: "Error fetching business" });
  }
};

export default {
  searchBusinesses,
  getBusinessById
};