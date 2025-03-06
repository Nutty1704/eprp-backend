import { parseValidationErrors } from "../lib/error-utils.js";

const errorHandler = (err, req, res, next) => {
    if (err.isCustom) {
        // Handle custom errors
        return res.status(err.status).json({
            success: false,
            error: true,
            message: err.message,
        });
    }

    if (err.name === "ValidationError") {
        const messages = parseValidationErrors(err);
        return res.status(400).json({
            success: false,
            error: true,
            errors: messages,
        });
    }

    // Handle other errors (e.g., Mongoose errors, generic server errors)
    console.error(err);
    res.status(500).json({
        success: false,
        error: true,
        message: "An internal server error occurred",
    });
};

export default errorHandler;