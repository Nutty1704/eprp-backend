import bcryptjs from "bcryptjs";

// Hash password
export const hashPassword = async (password) => {
    return await bcryptjs.hash(password, 10);
};
