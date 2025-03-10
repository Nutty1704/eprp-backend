import User from "../models/user/user.model.js";

// Check if user exists in the database
const checkUser = async (req, res) => {
  try {
    const { auth0Id } = req;
    const user = await User.findOne({ auth0Id });
    
    if (user) {
      return res.status(200).json({ exists: true, user });
    } else {
      return res.status(200).json({ 
        exists: false, 
        message: "User not found" 
      });
    }
  } catch (error) {
    console.error("Check user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new user based on role
const createUser = async (req, res) => {
  try {
    const { auth0Id } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ auth0Id });
    if (existingUser) {
      return res.status(200).json({ 
        message: "User already exists", 
        user: existingUser 
      });
    }
    
    // Create user based on role
    const newUser = new User(req.body)
    await newUser.save();
    
    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Error creating user" });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.userId });
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(currentUser);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, role } = req.body;
    
    // Find user to get their role
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.phone = phone;
    user.role = role;
    
    await user.save();

    res.send(user);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Error updating user" });
  }
};

export default {
  checkUser,
  createUser,
  getCurrentUser,
  updateUser
};