import Business from "../models/business/business.model.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

const updateMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({
      user: req.userId,
    });

    if (!business) {
      res.status(404).json({ message: "Business not found" });
      return;
    }

    business.businessName = req.body.businessName;
    business.description = req.body.description;
    business.email = req.body.email;
    business.phone = req.body.phone;
    business.address = req.body.address;
    business.cuisines = req.body.cuisines;
    business.menuItems = req.body.menuItems;
    business.lastUpdated = new Date();

    if (req.file) {
      const imageUrl = await uploadImage(req.file);
      business.imageUrl = imageUrl;
    }

    await business.save();
    res.status(200).send(business);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.userId });
    if (!business) {
      res.status(404).json({ message: "Business not found" });
      return;
    }
    res.json(business);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching Business" });
  }
};

const createMyBusiness = async (req, res) => {
  try {
    const existingBusiness = await Business.findOne({ user: req.userId });

    if (existingBusiness) {
      res.status(409).json({ message: "User business already exists" });
      return;
    }

    const imageUrl = await uploadImage(req.file);

    const business = new Business(req.body);
    business.imageUrl = imageUrl;
    business.user = new mongoose.Types(req.userId);
    business.lastUpdated = new Date();
    await business.save();

    res.status(201).send(business);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const uploadImage = async (file) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  createMyBusiness,
  getMyBusiness,
  updateMyBusiness,
};