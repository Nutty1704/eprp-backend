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