export const cloudinaryFolder = 'customers';

export const getFullId = (customer) => {
    return `${cloudinaryFolder}/${customer.user_id}`
}

export const getPublicId = (customer) => {
    return customer.user_id;
}