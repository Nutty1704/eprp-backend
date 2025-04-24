import Business from '../models/business/business.model.js'; 
import asyncHandler from 'express-async-handler'; 

const getCuisineSummary = asyncHandler(async (req, res) => {
    try {
        const cuisineCounts = await Business.aggregate([
            { $unwind: '$cuisines' },
            {
                $group: {
                    _id: '$cuisines', 
                    count: { $sum: 1 } 
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(cuisineCounts);

    } catch (error) {
        console.error(`Error fetching cuisine summary: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching cuisine summary' });
    }
});

export { getCuisineSummary };