import { body, validationResult } from "express-validator";

const handleValidationErrors = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateUserCreationRequest = [
  body("auth0Id").notEmpty().withMessage("Auth0 ID is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  //body("role").isIn(["Customer", "Owner"]).withMessage("Role must be either 'Customer' or 'Owner'"),
  //body("fname").notEmpty().withMessage("First name is required"),
  //body("lname").notEmpty().withMessage("Last name is required"),
  handleValidationErrors,
];

export const validateUserUpdateRequest = [
  body("fname").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lname").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  body("profile_image").optional(),
  handleValidationErrors,
];

export const validateMyBusinessRequest = [
  body("businessName").notEmpty().withMessage("Description name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("cuisines")
    .isArray()
    .withMessage("Cuisines must be an array")
    .not()
    .isEmpty()
    .withMessage("Cuisines array cannot be empty"),
  body("menuItems").isArray().withMessage("Menu items must be an array"),
  body("menuItems.*.name").notEmpty().withMessage("Menu item name is required"),
  body("menuItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Menu item price is required and must be a positive number"),
  handleValidationErrors,
];