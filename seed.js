import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Adjust paths based on your actual project structure
import Owner from './src/models/user/owner.model.js';
import Customer from './src/models/user/customer.model.js';
import Business from './src/models/business/business.model.js';
import Deal from './src/models/business/deal.model.js';
import Review from './src/models/review/review.model.js';
import ReviewUpvote from './src/models/review/review_upvote.model.js';
import Response from './src/models/review/response.model.js';
import PriceRange from './src/models/review/price_range.js'; // Corrected path assumption

dotenv.config();

// --- Configuration --- (Keep as before)
const MONGODB_URI = process.env.MONGODB_URI;
const NUM_OWNERS = 15;
const NUM_CUSTOMERS = 50;
const NUM_BUSINESSES_MIN = 60;
const NUM_BUSINESSES_MAX = 80;
const NUM_REVIEWS_PER_BUSINESS_MAX = 1000;
const NUM_DEALS_PER_BUSINESS_MAX = 4;
const UPVOTE_CHANCE = 0.3;
const RESPONSE_CHANCE = 0.2;
const DEFAULT_PASSWORD = 'password123';
const SALT_ROUNDS = 10;

// --- Helper Functions --- (Keep as before)
const generateOpeningHours = () => {
    const hours = {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const typicalOpen = ['08:00', '09:00', '10:00', '11:00'];
    const typicalClose = ['17:00', '18:00', '20:00', '21:00', '22:00'];
    const weekendClose = ['15:00', '16:00', '17:00'];

    days.forEach(day => {
        const isWeekend = day === 'sat' || day === 'sun';
        const usuallyOpen = Math.random() > (isWeekend ? 0.3 : 0.05); // Higher chance closed on weekend

        if (usuallyOpen) {
            const openTime = faker.helpers.arrayElement(typicalOpen);
            const closeTime = faker.helpers.arrayElement(isWeekend ? weekendClose : typicalClose);
            // Ensure close time is after open time (simplified check)
            if (parseInt(closeTime.split(':')[0]) > parseInt(openTime.split(':')[0])) {
                hours[day] = {
                    isOpen: true,
                    timeSlots: [{ open: openTime, close: closeTime }]
                };
            } else {
                 // Default if times are illogical or simple case
                 hours[day] = { isOpen: true, timeSlots: [{ open: '09:00', close: '17:00' }] };
            }
        } else {
            hours[day] = { isOpen: false, timeSlots: [] };
        }
    });
    return hours;
};
const generateMenuItems = (cuisine) => {
    const items = [];
    const numItems = faker.number.int({ min: 3, max: 8 });
    const commonItems = {
        Cafe: ['Latte', 'Cappuccino', 'Espresso', 'Avocado Toast', 'Croissant', 'Sandwich', 'Salad'],
        Italian: ['Margherita Pizza', 'Pasta Carbonara', 'Lasagne', 'Tiramisu', 'Garlic Bread'],
        Thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Spring Rolls', 'Massaman Curry'],
        Vietnamese: ['Pho Bo', 'Banh Mi', 'Spring Rolls (Goi Cuon)', 'Bun Cha', 'Com Tam'],
        Indian: ['Butter Chicken', 'Naan Bread', 'Samosa', 'Biryani', 'Vindaloo'],
        Chinese: ['Sweet and Sour Pork', 'Fried Rice', 'Dim Sum', 'Kung Pao Chicken', 'Noodle Soup'],
        Japanese: ['Sushi Platter', 'Ramen', 'Teriyaki Chicken', 'Miso Soup', 'Edamame'],
        Mexican: ['Tacos al Pastor', 'Burrito Bowl', 'Quesadilla', 'Nachos', 'Guacamole'],
        Australian: ['Chicken Parma', 'Fish and Chips', 'Steak', 'Burger with the Lot', 'Pavlova'],
        Pub: ['Burger', 'Steak Sandwich', 'Chicken Schnitzel', 'Wedges', 'Beer Battered Fries']
    };

    const possibleItems = commonItems[cuisine] || commonItems['Cafe']; // Default to Cafe if cuisine not listed

    for (let i = 0; i < numItems; i++) {
        items.push({
            _id: new mongoose.Types.ObjectId(),
            name: faker.helpers.arrayElement(possibleItems) + (Math.random() > 0.7 ? ` (${faker.lorem.words(1)})` : ''), // Add slight variation
            price: faker.number.float({ min: 5, max: 35, precision: 0.01 }),
            imageUrl: faker.image.urlLoremFlickr({ category: 'food', width: 300, height: 200 }),
        });
    }
    return items;
};
const englishDescriptions = [
    "A cozy spot perfect for students and locals alike, offering freshly brewed coffee and delicious pastries.",
    "Authentic flavours meet modern ambiance. Join us for a memorable dining experience with top-quality ingredients.",
    "Your go-to place for a quick lunch break or a relaxed dinner. We pride ourselves on friendly service and hearty meals.",
    "Experience the taste of tradition. Our family recipes have been passed down through generations.",
    "Specializing in vibrant dishes and a lively atmosphere. Great for groups and celebrations.",
    "A hidden gem offering gourmet meals at affordable prices. Perfect for foodies exploring the area.",
    "Relax and unwind with our selection of fine wines and artisanal cheese platters in a sophisticated setting.",
    "We serve classic comfort food with a creative twist. Stop by for breakfast, lunch, or dinner!",
    "Dedicated to sustainability and local produce, our menu changes seasonally to offer the freshest options.",
    "The ideal location for business lunches or catching up with friends over high-quality coffee and snacks.",
    "Bringing international street food flavours to the heart of the city. Quick, tasty, and always exciting.",
    "A warm and welcoming cafe known for its friendly staff, excellent coffee, and delicious brunch menu.",
    "Enjoy stunning city views while dining on our rooftop terrace. We offer a contemporary menu with global influences.",
    "Passionate about good food and great company. We offer a diverse menu to satisfy all cravings.",
    "Our chefs use only the finest ingredients to create dishes that are both delicious and beautifully presented."
];
const generateDealData = (businessId, ownerId) => {
    const type = faker.helpers.arrayElement(['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'FREE_ITEM', 'SET_MENU']);
    const startDate = faker.date.soon({ days: 30 }); // Start within next 30 days
    const endDate = faker.date.future({ years: 0.5, refDate: startDate }); // End within 6 months after start
    let discountValue;
    let title = '';
    let appliesTo = '';

    switch (type) {
        case 'PERCENTAGE':
            discountValue = faker.helpers.arrayElement([10, 15, 20, 25, 50]);
            title = `${discountValue}% Off ${faker.helpers.arrayElement(['Lunch', 'Dinner', 'Your Order', 'Weekends'])}`;
            appliesTo = faker.helpers.arrayElement(['Entire bill', 'Food items only', 'Specific menu section']);
            break;
        case 'FIXED_AMOUNT':
            discountValue = faker.helpers.arrayElement([5, 10, 15, 20]);
            title = `$${discountValue} Off ${faker.helpers.arrayElement(['Orders over $50', 'Your Next Visit', 'Takeaway'])}`;
            appliesTo = 'Total bill';
            break;
        case 'BOGO':
            title = `Buy One Get One ${faker.helpers.arrayElement(['Coffee', 'Pizza Slice', 'Main Course', 'Dessert'])}`;
            appliesTo = faker.helpers.arrayElement(['Specific item', 'Items of equal or lesser value']);
            discountValue = null; // No specific value needed for simple BOGO
            break;
        case 'FREE_ITEM':
            title = `Free ${faker.helpers.arrayElement(['Drink', 'Side Dish', 'Appetizer'])} with purchase over $${faker.helpers.arrayElement([20, 30, 40])}`;
            appliesTo = 'With qualifying purchase';
            discountValue = null;
            break;
        case 'SET_MENU':
            title = `${faker.helpers.arrayElement(['Lunch', 'Dinner', 'Express'])} Set Menu $${faker.helpers.arrayElement([25, 35, 45])}`;
            appliesTo = 'Set menu items only';
            discountValue = faker.helpers.arrayElement([25, 35, 45]); // Store the set price here
            break;
        default:
            title = 'Special Offer';
            discountValue = null;
    }

    return {
        title: title,
        description: faker.lorem.sentence(),
        type: type,
        discountValue: discountValue,
        startDate: startDate,
        endDate: endDate,
        // status will be set by pre-save hook based on dates
        redemptionInfo: faker.lorem.sentence(5),
        appliesTo: appliesTo,
        minimumSpend: type === 'FIXED_AMOUNT' ? faker.helpers.arrayElement([0, 25, 50]) : 0,
        business_id: businessId,
        owner_id: ownerId,
    };
};
const generateReviewData = (customerId, businessId) => {
    const foodRating = faker.number.int({ min: 1, max: 5 });
    const serviceRating = faker.number.int({ min: 1, max: 5 });
    const ambienceRating = faker.number.int({ min: 1, max: 5 });

    const reviewTitles = [
        "Great Experience!", "Loved the food!", "Amazing Service", "Cozy Atmosphere",
        "Highly Recommend", "A Must Try", "Decent Spot", "Could Be Better",
        "Not Bad", "Fantastic Meal", "Wonderful Evening", "Delicious!",
        "Best " + faker.commerce.productName() + " in town!",
        "My new favorite " + faker.helpers.arrayElement(['cafe', 'restaurant', 'eatery']) + "!",
        "A " + faker.word.adjective() + " surprise!",
        "The " + faker.commerce.productAdjective() + " " + faker.commerce.productName() + " was " + faker.word.adjective() + "."
    ];

    return {
        title: faker.helpers.arrayElement(reviewTitles),
        text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
        foodRating: foodRating,
        serviceRating: serviceRating,
        ambienceRating: ambienceRating,
        customerId: customerId,
        businessId: businessId,
        images: Math.random() > 0.6 ?
            Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.image.urlLoremFlickr({ category: 'food', width: 640, height: 480 }))
            : [],
    };
};


// --- Main Seeding Function ---
const seedDatabase = async () => {
    if (!MONGODB_URI) {
        console.error("Error: MONGODB_URI is not defined in the .env file.");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB connected successfully.");

        // --- Clearing Existing Data ---
        console.log("--- Clearing Existing Data ---");
        console.log("Deleting Responses...");
        await Response.deleteMany({});
        console.log("Deleting Review Upvotes...");
        await ReviewUpvote.deleteMany({});
        console.log("Deleting Reviews...");
        await Review.deleteMany({});
        console.log("Deleting Deals...");
        await Deal.deleteMany({});
        console.log("Deleting Businesses...");
        await Business.deleteMany({});
        console.log("Deleting Price Ranges...");
        await PriceRange.deleteMany({});
        console.log("Deleting Customers...");
        await Customer.deleteMany({}); // Delete Customers
        console.log("Deleting Owners...");
        await Owner.deleteMany({});    // Delete Owners
        // await User.deleteMany({}); // REMOVED User deletion
        console.log("Existing data cleared.");

        console.log("--- Generating New Data ---");

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

        // 1. Generate Owners (Standalone)
        console.log("Generating Owners...");
        const ownersData = [];
        for (let i = 0; i < NUM_OWNERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            ownersData.push({
                // Assuming Owner model now has email, password, fname, lname directly
                email: faker.internet.email({ firstName, lastName, provider: `owner${i}.test` }),
                password: hashedPassword,
                fname: firstName,
                lname: lastName,
                profile_image: faker.image.avatar(),
                // Add any other required fields from your Owner model
            });
        }
        const createdOwners = await Owner.insertMany(ownersData);
        console.log(`${createdOwners.length} owners inserted.`);

        // 2. Generate Customers (Standalone)
        console.log("Generating Customers...");
        const customersData = [];
        for (let i = 0; i < NUM_CUSTOMERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            customersData.push({
                // Assuming Customer model now has email, password, name directly
                email: faker.internet.email({ firstName, lastName, provider: `customer${i}.test` }),
                password: hashedPassword,
                name: `${firstName} ${lastName}`,
                bio: faker.lorem.sentence(),
                review_count: 0, // Start review count at 0
                profile_image: faker.image.avatar(),
                 // Add any other required fields from your Customer model
            });
        }
        // *** CORRECTED VARIABLE NAME HERE ***
        const createdCustomers = await Customer.insertMany(customersData);
        console.log(`${createdCustomers.length} customers inserted.`); // Corrected log message


        // 3. Generate Price Ranges (Keep as before)
        console.log("Generating Price Ranges...");
        const priceRangesData = [
            { lower_bound: 0, upper_bound: 20 },   // $
            { lower_bound: 21, upper_bound: 40 },  // $$
            { lower_bound: 41, upper_bound: 60 },  // $$$
            { lower_bound: 61, upper_bound: 1000 } // $$$$
        ];
        const createdPriceRanges = await PriceRange.insertMany(priceRangesData);
        console.log(`${createdPriceRanges.length} price ranges inserted.`);

        // 4. Generate Businesses (Keep as before, uses createdOwners)
        console.log("Generating Businesses...");
        const businessesData = [];
        const numBusinesses = faker.number.int({ min: NUM_BUSINESSES_MIN, max: NUM_BUSINESSES_MAX });
        const cuisinesList = ['Cafe', 'Italian', 'Thai', 'Vietnamese', 'Indian', 'Chinese', 'Japanese', 'Mexican', 'Australian', 'Pub', 'Vegan', 'Seafood'];
        const melbourneLocations = [
             { area: "Clayton", postcode: "3168", vicinity: ["Clayton Rd", "Centre Rd", "Monash Uni Campus"] },
             { area: "Caulfield", postcode: "3162", vicinity: ["Derby Rd", "Sir John Monash Dr", "Caulfield East"] },
             { area: "Parkville", postcode: "3052", vicinity: ["Royal Parade", "Grattan St", "Near UniMelb"] },
             { area: "Melbourne CBD", postcode: "3000", vicinity: ["Collins St", "Bourke St", "Flinders Ln"] },
        ];

        for (let i = 0; i < numBusinesses; i++) {
            const owner = faker.helpers.arrayElement(createdOwners); // Use created Owner documents
            const locationInfo = faker.helpers.arrayElement(melbourneLocations);
            const businessName = faker.company.name() + (Math.random() > 0.5 ? ` ${faker.helpers.arrayElement(['Eatery', 'Cafe', 'Bistro', 'Kitchen', 'Bar', 'Grill', 'House'])}` : '');
            const selectedCuisines = faker.helpers.arrayElements(cuisinesList, { min: 1, max: 3 });
            const selectedPriceRange = faker.helpers.arrayElement(createdPriceRanges);
            const domainName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) || faker.lorem.slug(2);
            const websiteUrl = `https://www.${domainName}.com.au`;

            businessesData.push({
                name: businessName,
                description: faker.helpers.arrayElement(englishDescriptions),
                email: faker.internet.email({ firstName: owner.fname.toLowerCase(), provider: `${domainName}.test` }),
                phone: faker.phone.number('039#######'),
                address: `${faker.location.streetAddress(true)}, ${locationInfo.area}, VIC ${locationInfo.postcode}`,
                rating: 0, foodRating: 0, serviceRating: 0, ambienceRating: 0, review_count: 0,
                website: websiteUrl,
                imageUrl: faker.image.urlLoremFlickr({ category: 'restaurant', width: 640, height: 480 }),
                images: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.image.urlLoremFlickr({ category: 'food', width: 640, height: 480 })),
                owner_id: owner._id, // Link to the created Owner ID
                price_range_id: selectedPriceRange._id,
                menuItems: generateMenuItems(selectedCuisines[0]),
                cuisines: selectedCuisines,
                openingHours: generateOpeningHours(),
            });
        }
        const createdBusinesses = await Business.insertMany(businessesData);
        console.log(`${createdBusinesses.length} businesses inserted.`);

        // 5. Generate Reviews (Uses createdCustomers - now correctly defined)
        console.log("Generating Reviews...");
        const reviewsData = [];
        const businessReviewCounts = {};
        const customerReviewCounts = {};

        for (const business of createdBusinesses) {
            const numReviews = faker.number.int({ min: 0, max: NUM_REVIEWS_PER_BUSINESS_MAX });
            const potentialReviewers = faker.helpers.shuffle([...createdCustomers]); // Uses createdCustomers

            for (let i = 0; i < numReviews && i < potentialReviewers.length; i++) {
                const customer = potentialReviewers[i];
                reviewsData.push(generateReviewData(customer._id, business._id)); // Use Customer ID
                businessReviewCounts[business._id] = (businessReviewCounts[business._id] || 0) + 1;
                customerReviewCounts[customer._id] = (customerReviewCounts[customer._id] || 0) + 1;
            }
        }
        const createdReviews = await Review.insertMany(reviewsData);
        console.log(`${createdReviews.length} reviews inserted.`);

        console.log("Updating Business review counts and average ratings...");
        const businessUpdatePromises = createdBusinesses.map(async (business) => {
             const reviewsForBusiness = createdReviews.filter(r => r.businessId.equals(business._id));
             const reviewCount = reviewsForBusiness.length;

             if (reviewCount > 0) {
                 // Calculate sums safely, defaulting to 0 if a rating is missing/invalid
                 const totalFood = reviewsForBusiness.reduce((sum, r) => sum + (Number(r.foodRating) || 0), 0);
                 const totalService = reviewsForBusiness.reduce((sum, r) => sum + (Number(r.serviceRating) || 0), 0);
                 const totalAmbience = reviewsForBusiness.reduce((sum, r) => sum + (Number(r.ambienceRating) || 0), 0);

                 // Calculate component averages
                 const avgFood = totalFood / reviewCount;
                 const avgService = totalService / reviewCount;
                 const avgAmbience = totalAmbience / reviewCount;

                 // --- CORRECTED OVERALL RATING CALCULATION ---
                 // Calculate the overall business rating as the average of the component averages
                 const avgRating = (avgFood + avgService + avgAmbience) / 3;
                 // --- END CORRECTION ---

                 await Business.findByIdAndUpdate(business._id, {
                     review_count: reviewCount,
                     // Assign the correctly calculated averages
                     rating: avgRating,
                     foodRating: avgFood,
                     serviceRating: avgService,
                     ambienceRating: avgAmbience,
                 });
             }
             // If reviewCount is 0, the business keeps its initial 0 ratings.
         });
        await Promise.all(businessUpdatePromises);
        console.log("Business review counts updated.");

        // --- Update Customer Review Counts (Keep as before) ---
        console.log("Updating Customer review counts...");
        const customerUpdatePromises = createdCustomers.map(async (customer) => {
             const count = customerReviewCounts[customer._id] || 0;
             if (count > 0) {
                await Customer.findByIdAndUpdate(customer._id, { review_count: count });
             }
         });
         await Promise.all(customerUpdatePromises);
        console.log("Customer review counts updated.");

        // 7. Generate Deals (Keep as before)
        console.log("Generating Deals...");
        const dealsData = [];
        for (const business of createdBusinesses) {
            const numDeals = faker.number.int({ min: 0, max: NUM_DEALS_PER_BUSINESS_MAX });
            for (let i = 0; i < numDeals; i++) {
                dealsData.push(generateDealData(business._id, business.owner_id));
            }
        }
        const createdDeals = await Deal.insertMany(dealsData);
        console.log(`${createdDeals.length} deals inserted.`);

        // 8. Generate Review Upvotes (Uses createdCustomers - now correctly defined)
        console.log("Generating Review Upvotes...");
        const upvotesData = [];
        const upvotedPairs = new Set(); // To avoid duplicate upvotes from the same customer for the same review

        if (createdReviews.length > 0 && createdCustomers.length > 0) { // Ensure there are customers to upvote
            for (const review of createdReviews) {
                 // Only customers can upvote, according to ReviewUpvote schema
                 const potentialCustomerUpvoters = faker.helpers.shuffle([...createdCustomers]);

                 for (const customer of potentialCustomerUpvoters) {
                    // A customer cannot upvote their own review
                    if (customer._id.equals(review.customerId)) {
                        continue;
                    }

                    // Random chance for this customer to upvote this review
                    if (Math.random() < UPVOTE_CHANCE) {
                        const pairKey = `${customer._id}-${review._id}`;
                        if (!upvotedPairs.has(pairKey)) {
                             upvotesData.push({
                                reviewId: review._id,     // Corrected: schema expects reviewId
                                customerId: customer._id, // Corrected: schema expects customerId
                             });
                             upvotedPairs.add(pairKey);
                        }
                        // Limit upvotes per review slightly to make it more realistic
                        // (e.g., not every customer upvotes every review they didn't write)
                        if (Math.random() > 0.7) break;
                    }
                 }
            }
            if (upvotesData.length > 0) {
                await ReviewUpvote.insertMany(upvotesData);
            }
            console.log(`${upvotesData.length} review upvotes added.`);
        } else {
             console.log("Skipping upvotes (no reviews or no customers to upvote).")
        }

        // 9. Generate Responses (Keep as before)
        console.log("Generating Responses...");
        const responsesData = [];
        if (createdReviews.length > 0) {
            for (const review of createdReviews) {
                if (Math.random() < RESPONSE_CHANCE) {
                    responsesData.push({
                        review_id: review._id,
                        text: faker.lorem.sentence(faker.number.int({ min: 10, max: 30 })),
                    });
                }
            }
            await Response.insertMany(responsesData);
            console.log(`${responsesData.length} responses inserted.`);
        } else {
            console.log("Skipping responses (no reviews).")
        }


        console.log("--- Seeding Completed Successfully ---");

    } catch (error) {
        console.error("--- Error during seeding ---");
        console.error(error);
        process.exit(1);
    } finally {
        console.log("Closing MongoDB connection...");
        await mongoose.disconnect();
        console.log("Connection closed.");
    }
};

// --- Run the Seeding Script ---
seedDatabase();
