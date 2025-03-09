export const cloudinaryFolder = 'reviews';

export const getFullId = (review, imgNumber) => `${cloudinaryFolder}/${review._id}-${imgNumber}`

export const getPublicId = (review, imgNumber) => (
    `${review._id}-${imgNumber}`
)