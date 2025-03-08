export const cloudinaryFolder = 'customers';

export const getPublicId = (customer) => {
    return `${cloudinaryFolder}/${customer.user_id}`
}