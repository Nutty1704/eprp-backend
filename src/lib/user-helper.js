import Customer from "../models/user/customer.model.js";
import Owner from "../models/user/owner.model.js";
import User from "../models/user/user.model.js";
import { InvalidRoleError } from "./error-utils.js";

// Helper function to create a role-specific entity
export const createRoleEntity = async (role, user, body) => {
    switch (role) {

        case "customer":
            const { name = "", bio = "" } = body;
            const customer = new Customer({
                user_id: user._id,
                name,
                bio,
            });
            await customer.save();

            User.updateOne({ _id: user._id }, { $set: { "roles.customer": true } });
            break;

        case "owner":
            const { fname, lname } = body;
            const owner = new Owner({
                user_id: user._id,
                fname,
                lname,
            });
            await owner.save();

            User.updateOne({ _id: user._id }, { $set: { "roles.owner": true } });
            break;

        default:
            throw InvalidRoleError.create();
    }
};


export const isValidUserRole = (role) => {
    return ["customer", "owner"].includes(role);
}


export const alreadyExists = async (user, role) => {
    switch (role) {

        case "customer":
            return !!user.roles.customer;

        case "owner":
            return !!user.roles.owner;
        
        default:
            throw InvalidRoleError.create();
    }
}


export const fetchRoleEntity = async (user, role) => {
    switch (role) {

        case "customer":
            const customer = await Customer.findOne({ user_id: user._id });
            return customer;
        
        case "owner":
            const owner = await Owner.findOne({ user_id: user._id });
            return owner;
        
        default:
            throw InvalidRoleError.create();
    }
}