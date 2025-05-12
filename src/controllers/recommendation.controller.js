// src/controllers/recommendation.controller.js
import mongoose from 'mongoose';
import Customer from '../models/user/customer.model.js';
import Business from '../models/business/business.model.js';
import Deal from '../models/business/deal.model.js';
import PriceRange from '../models/review/price_range.js'; // --- ADDED IMPORT --- Ensure this path is correct
import Review from '../models/review/review.model.js'; // --- ADDED IMPORT for Review model ---

const MAX_RECOMMENDATIONS = 10;
const MAX_ITEMS_PER_CATEGORY = 5; // Limit items for new personalized categories initially
const DEFAULT_RADIUS_METERS = 5000;
const HIGH_RATING_THRESHOLD = 4; // Reviews with rating >= this are considered positive

// Helper to build a base query for businesses (sorting, basic filters)
const getBaseBusinessQuery = (filters = {}, limit = MAX_RECOMMENDATIONS) => { // Added limit parameter
    return Business.find(filters)
        .populate('price_range_id', 'lower_bound upper_bound')
        .sort({ rating: -1, review_count: -1 })
        .limit(limit);
};

// Helper to build a base query for deals
const getBaseDealQuery = (businessIds = null, extraFilters = {}, limit = MAX_RECOMMENDATIONS) => { // Added limit parameter
    const now = new Date();
    let dealFilters = {
        status: 'ACTIVE',
        startDate: { $lte: now },
        endDate: { $gte: now },
        ...extraFilters,
    };
    if (businessIds && businessIds.length > 0) {
        dealFilters.business_id = { $in: businessIds };
    }

    return Deal.find(dealFilters)
        .populate({
            path: 'business_id',
            select: 'name address imageUrl cuisines rating review_count location website',
            populate: { path: 'price_range_id', select: 'lower_bound upper_bound' }
        })
        .sort({ createdAt: -1 }) // Or other relevant sorting for deals
        .limit(limit);
};


export const getRecommendations = async (req, res) => {
    try {
        let customer = null;
        let customerId = null;

        if (req.customer && req.customer._id) {
            customer = req.customer; // Set by isCustomerOptional middleware
            customerId = req.customer._id;
        } else if (req.user && req.user._id) { // Fallback if isCustomerOptional didn't set req.customer but user is logged in
            // This logic depends on how your auth is set up.
            // If req.user is the Customer document, this is fine.
            // If req.user is a generic user, you might need to fetch the Customer profile.
            const potentialCustomer = await Customer.findById(req.user._id).lean();
            if (potentialCustomer) { // Check if a customer profile exists for this user ID
                customer = potentialCustomer;
                customerId = potentialCustomer._id;
            }
        }

        const { latitude, longitude, preferredSuburb: querySuburb } = req.query;
        const hasPreciseLocation = latitude && longitude;
        const effectivePreferredSuburb = customer?.preferredSuburb || querySuburb;

        let recommendations = {
            basedOnYourActivity: [], // --- NEW Phase 2 category ---
            dealsBasedOnActivity: [], // --- NEW Phase 2 category ---
            byYourPreferences: [],    // Phase 1
            popularNearYou: [],       // Phase 1
            dealsForYou: [],          // Phase 1 (will be enhanced by activity)
            trendingOverall: [],      // Phase 1
        };

        const commonBusinessExclusions = {}; // To avoid showing same business in multiple lists
        let reviewedBusinessIds = []; // Businesses customer has already reviewed

        // --- Phase 2: Logic based on customer's activity ---
        if (customerId) {
            // 1. Fetch customer's highly-rated reviews
            const positiveReviews = await Review.find({
                customerId: customerId,
                rating: { $gte: HIGH_RATING_THRESHOLD }
            }).populate('businessId', 'cuisines price_range_id').lean(); // Populate necessary fields

            reviewedBusinessIds = positiveReviews.map(r => r.businessId._id.toString());
            positiveReviews.forEach(r => commonBusinessExclusions[r.businessId._id.toString()] = true);


            if (positiveReviews.length > 0) {
                const likedCuisines = [...new Set(positiveReviews.flatMap(r => r.businessId.cuisines))];
                const likedPriceRanges = [...new Set(positiveReviews.map(r => r.businessId.price_range_id?._id).filter(id => id))];

                // 2. "Because You Liked..." (Content-Based)
                if (likedCuisines.length > 0 || likedPriceRanges.length > 0) {
                    const activityBasedQuery = {};
                    if (likedCuisines.length > 0) activityBasedQuery.cuisines = { $in: likedCuisines };
                    if (likedPriceRanges.length > 0) activityBasedQuery.price_range_id = { $in: likedPriceRanges };

                    // Apply location if available
                    let locationFilterForActivity = {};
                     if (hasPreciseLocation) {
                        locationFilterForActivity = { location: { $near: { $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] }, $maxDistance: DEFAULT_RADIUS_METERS }}};
                    } else if (effectivePreferredSuburb) {
                        locationFilterForActivity = { address: { $regex: effectivePreferredSuburb, $options: 'i' } };
                    }

                    const activityBusinesses = await getBaseBusinessQuery({
                        ...activityBasedQuery,
                        ...locationFilterForActivity,
                        _id: { $nin: Object.keys(commonBusinessExclusions) } // Exclude already reviewed/shown
                    }, MAX_ITEMS_PER_CATEGORY);

                    recommendations.basedOnYourActivity = activityBusinesses;
                    activityBusinesses.forEach(b => commonBusinessExclusions[b._id.toString()] = true);
                }

                // 3. "Deals Based on Your Activity" (liked cuisines)
                if (likedCuisines.length > 0) {
                    // Find businesses matching liked cuisines (can be broader than just activityBusinesses)
                    const businessesWithLikedCuisines = await Business.find({
                        cuisines: { $in: likedCuisines },
                        _id: { $nin: Object.keys(commonBusinessExclusions) } // Optionally exclude already recommended businesses
                    }).select('_id').lean();

                    if (businessesWithLikedCuisines.length > 0) {
                        const businessIdsForDeals = businessesWithLikedCuisines.map(b => b._id);
                        const activityDeals = await getBaseDealQuery(businessIdsForDeals, {}, MAX_ITEMS_PER_CATEGORY);
                        recommendations.dealsBasedOnActivity = activityDeals;
                    }
                }
            }
        }
        // --- End Phase 2 Logic ---


        // --- Phase 1 Logic (modified to consider exclusions and fill up) ---
        let locationQuery = {};
        if (hasPreciseLocation) {
            locationQuery = { location: { $near: { $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] }, $maxDistance: DEFAULT_RADIUS_METERS }}};
        } else if (effectivePreferredSuburb) {
            locationQuery = { address: { $regex: effectivePreferredSuburb, $options: 'i' } };
        }

        // A1 & B1: Based on explicitly preferred cuisines (from customer profile)
        if (customer?.preferredCuisines && customer.preferredCuisines.length > 0) {
            if (recommendations.byYourPreferences.length < MAX_ITEMS_PER_CATEGORY) {
                const preferredCuisineQuery = {
                    ...locationQuery, // Empty if no location
                    cuisines: { $in: customer.preferredCuisines },
                    _id: { $nin: Object.keys(commonBusinessExclusions) }
                };
                const preferredBusinesses = await getBaseBusinessQuery(preferredCuisineQuery, MAX_ITEMS_PER_CATEGORY - recommendations.byYourPreferences.length);
                recommendations.byYourPreferences = [...recommendations.byYourPreferences, ...preferredBusinesses]
                    .filter((b, i, self) => i === self.findIndex(el => el._id.equals(b._id))) // Deduplicate
                    .slice(0, MAX_ITEMS_PER_CATEGORY);
                preferredBusinesses.forEach(b => commonBusinessExclusions[b._id.toString()] = true);

                // A2 & B2: Deals for explicitly preferred cuisines
                if (preferredBusinesses.length > 0 && recommendations.dealsForYou.length < MAX_ITEMS_PER_CATEGORY) {
                    const businessIdsFromPrefs = preferredBusinesses.map(b => b._id);
                    const dealsForPrefs = await getBaseDealQuery(businessIdsFromPrefs, {}, MAX_ITEMS_PER_CATEGORY - recommendations.dealsForYou.length);
                    recommendations.dealsForYou = [...recommendations.dealsForYou, ...dealsForPrefs]
                         .filter((d, i, self) => i === self.findIndex(el => el._id.equals(d._id)))
                         .slice(0, MAX_ITEMS_PER_CATEGORY);
                }
            }
        }

        // C1: Popular Near You (if location is available)
        if ((hasPreciseLocation || effectivePreferredSuburb) && recommendations.popularNearYou.length < MAX_ITEMS_PER_CATEGORY) {
            const nearbyQuery = { ...locationQuery, _id: { $nin: Object.keys(commonBusinessExclusions) } };
            const popularNearbyBusinesses = await getBaseBusinessQuery(nearbyQuery, MAX_ITEMS_PER_CATEGORY - recommendations.popularNearYou.length);
            recommendations.popularNearYou = [...recommendations.popularNearYou, ...popularNearbyBusinesses]
                .filter((b, i, self) => i === self.findIndex(el => el._id.equals(b._id)))
                .slice(0, MAX_ITEMS_PER_CATEGORY);
            popularNearbyBusinesses.forEach(b => commonBusinessExclusions[b._id.toString()] = true);

            // C2: Hot Deals Nearby (if dealsForYou is still not full)
            if (popularNearbyBusinesses.length > 0 && recommendations.dealsForYou.length < MAX_ITEMS_PER_CATEGORY) {
                const businessIdsNearby = popularNearbyBusinesses.map(b => b._id);
                const dealsNearby = await getBaseDealQuery(businessIdsNearby, {}, MAX_ITEMS_PER_CATEGORY - recommendations.dealsForYou.length);
                recommendations.dealsForYou = [...recommendations.dealsForYou, ...dealsNearby]
                    .filter((d, i, self) => i === self.findIndex(el => el._id.equals(d._id)))
                    .slice(0, MAX_ITEMS_PER_CATEGORY);
            }
        }

        // D: Fallback - Overall Trending & General Deals
        if (recommendations.trendingOverall.length < MAX_ITEMS_PER_CATEGORY) {
            const trendingQuery = {
                review_count: { $gte: 10 }, // Example: Min 10 reviews
                _id: { $nin: Object.keys(commonBusinessExclusions) }
            };
            const trendingBusinesses = await getBaseBusinessQuery(trendingQuery, MAX_ITEMS_PER_CATEGORY - recommendations.trendingOverall.length);
            recommendations.trendingOverall = [...recommendations.trendingOverall, ...trendingBusinesses]
                .filter((b, i, self) => i === self.findIndex(el => el._id.equals(b._id)))
                .slice(0, MAX_ITEMS_PER_CATEGORY);
            // trendingBusinesses.forEach(b => commonBusinessExclusions[b._id.toString()] = true); // Not strictly needed for last category
        }

        // Fill up general deals if other deal categories are not full
        if (recommendations.dealsForYou.length < MAX_ITEMS_PER_CATEGORY && recommendations.dealsBasedOnActivity.length < MAX_ITEMS_PER_CATEGORY) {
            const generalDeals = await getBaseDealQuery(null, {}, MAX_ITEMS_PER_CATEGORY - Math.max(recommendations.dealsForYou.length, recommendations.dealsBasedOnActivity.length));
            // Merge with existing dealsForYou, ensuring no duplicates from dealsBasedOnActivity
            const existingDealIds = new Set([...recommendations.dealsForYou.map(d => d._id.toString()), ...recommendations.dealsBasedOnActivity.map(d => d._id.toString())]);
            const uniqueGeneralDeals = generalDeals.filter(d => !existingDealIds.has(d._id.toString()));

            recommendations.dealsForYou = [...recommendations.dealsForYou, ...uniqueGeneralDeals]
                .filter((d, i, self) => i === self.findIndex(el => el._id.equals(d._id)))
                .slice(0, MAX_ITEMS_PER_CATEGORY);
        }


        // Filter out empty recommendation arrays before sending
        const finalRecommendations = {};
        for (const key in recommendations) {
            if (recommendations[key] && recommendations[key].length > 0) {
                finalRecommendations[key] = recommendations[key];
            }
        }

        res.status(200).json(finalRecommendations);

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: "Error fetching recommendations", error: error.message });
    }
};

export default {
    getRecommendations
};