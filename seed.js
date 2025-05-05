import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

import Owner from './src/models/user/owner.model.js';
import Customer from './src/models/user/customer.model.js';
import Business from './src/models/business/business.model.js'; 

dotenv.config(); // Load environment variables from .env file

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const NUM_OWNERS = 15; // Number of owner users to create
const NUM_CUSTOMERS = 40; // Number of customer users to create
const NUM_BUSINESSES_MIN = 60; // Minimum number of businesses
const NUM_BUSINESSES_MAX = 80; // Maximum number of businesses
const DEFAULT_PASSWORD = 'password123'; // Default password for all test users
const SALT_ROUNDS = 10; // For bcrypt hashing

// --- Helper Functions ---

// Generate realistic opening hours with some variations
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

// Generate sample menu items
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

        console.log("--- Clearing Existing Data ---");
        console.log("Deleting Businesses...");
        await Business.deleteMany({});
        console.log("Deleting Customers...");
        await Customer.deleteMany({});
        console.log("Deleting Owners...");
        await Owner.deleteMany({});
        

        console.log("--- Generating New Data ---");

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

        // 1. Generate Customer data
        const customers = []
        for (let i = 0; i < NUM_CUSTOMERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const customer = {
                email: faker.internet.email({ firstName, lastName, provider: `customer${i}.test`}), // Ensure unique emails
                password: hashedPassword,
                name: `${firstName} ${lastName}`,
                bio: faker.lorem.sentence(),
                review_count: faker.number.int({ min: 0, max: 50 }), // Give some initial review counts
                profile_image: faker.image.avatar(),
            };
            customers.push(customer);
        }

        const createdUsers = await Customer.insertMany(customers);
        console.log(`${createdUsers.length} users inserted.`);

        // 2. Generate Owner data
        const Owners = []
        for (let i = 0; i < NUM_OWNERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const owner = {
                email: faker.internet.email({ firstName, lastName, provider: `owner${i}.test`}), // Ensure unique emails
                password: hashedPassword,
                fname: `${firstName}`,
                lname: ` ${lastName}`,
                profile_image: faker.image.avatar(),
            };
            Owners.push(owner);
        }

        const createdOwners = await Owner.insertMany(Owners);
        console.log(`${createdOwners.length} owners inserted.`);


        // // 1. Generate Users
        // const users = [];
        // const ownerUserIds = [];
        // const customerUserIds = [];
        // 

        // console.log(`Generating ${NUM_OWNERS} owner users...`);
        // for (let i = 0; i < NUM_OWNERS; i++) {
        //     const firstName = faker.person.firstName();
        //     const lastName = faker.person.lastName();
        //     const user = {
        //         email: faker.internet.email({ firstName, lastName, provider: `owner${i}.test`}), // Ensure unique emails
        //         password: hashedPassword,
        //         name: `${firstName} ${lastName}`,
        //         phone: faker.phone.number('04########'),
        //         roles: { owner: true }, // Mark as owner role
        //         // googleId: null // Assuming no googleId for seeded users
        //     };
        //     users.push(user);
        // }

        // console.log(`Generating ${NUM_CUSTOMERS} customer users...`);
        // for (let i = 0; i < NUM_CUSTOMERS; i++) {
        //     const firstName = faker.person.firstName();
        //     const lastName = faker.person.lastName();
        //     const user = {
        //         email: faker.internet.email({ firstName, lastName, provider: `customer${i}.test`}), // Ensure unique emails
        //         password: hashedPassword,
        //         name: `${firstName} ${lastName}`,
        //         phone: faker.phone.number('04########'),
        //         roles: { customer: true }, // Mark as customer role
        //     };
        //     users.push(user);
        // }

        // console.log("Inserting Users...");
        // const createdUsers = await User.insertMany(users);
        // console.log(`${createdUsers.length} users inserted.`);

        // createdUsers.forEach(user => {
        //     if (user.roles.has('owner')) {
        //         ownerUserIds.push(user._id);
        //     } else if (user.roles.has('customer')) {
        //         customerUserIds.push(user._id);
        //     }
        // });

        // // 2. Generate Owners
        // console.log("Generating Owners...");
        // const ownersData = ownerUserIds.map(userId => {
        //     const user = createdUsers.find(u => u._id.equals(userId));
        //     const nameParts = user.name.split(' ');
        //     return {
        //         user_id: userId,
        //         fname: nameParts[0],
        //         lname: nameParts.slice(1).join(' ') || 'OwnerLastName', // Handle single names
        //         profile_image: faker.image.avatar(),
        //     };
        // });
        // const createdOwners = await Owner.insertMany(ownersData);
        // console.log(`${createdOwners.length} owners inserted.`);

        // // 3. Generate Customers
        // console.log("Generating Customers...");
        // const customersData = customerUserIds.map(userId => {
        //      const user = createdUsers.find(u => u._id.equals(userId));
        //      return {
        //         user_id: userId,
        //         name: user.name,
        //         bio: faker.lorem.sentence(),
        //         review_count: faker.number.int({ min: 0, max: 50 }), // Give some initial review counts
        //         profile_image: faker.image.avatar(),
        //     };
        // });
        // const createdCustomers = await Customer.insertMany(customersData);
        // console.log(`${createdCustomers.length} customers inserted.`);

        // 4. Generate Businesses
        console.log("Generating Businesses...");
        const businessesData = [];
        const numBusinesses = faker.number.int({ min: NUM_BUSINESSES_MIN, max: NUM_BUSINESSES_MAX });
        const cuisinesList = ['Cafe', 'Italian', 'Thai', 'Vietnamese', 'Indian', 'Chinese', 'Japanese', 'Mexican', 'Australian', 'Pub'];
        const melbourneLocations = [
            { area: "Clayton", postcode: "3168", vicinity: ["Clayton Rd", "Centre Rd", "Monash Uni Campus"] },
            { area: "Caulfield", postcode: "3162", vicinity: ["Derby Rd", "Sir John Monash Dr", "Caulfield East"] },
            { area: "Parkville", postcode: "3052", vicinity: ["Royal Parade", "Grattan St", "Near UniMelb"] },
            { area: "Melbourne CBD", postcode: "3000", vicinity: ["Collins St", "Bourke St", "Flinders Ln"] },
        ];

        for (let i = 0; i < numBusinesses; i++) {
            const owner = faker.helpers.arrayElement(createdOwners);
            const locationInfo = faker.helpers.arrayElement(melbourneLocations);
            const businessName = faker.company.name() + (Math.random() > 0.5 ? ` ${faker.helpers.arrayElement(['Eatery', 'Cafe', 'Bistro', 'Kitchen', 'Bar', 'Grill'])}` : '');
            const selectedCuisines = faker.helpers.arrayElements(cuisinesList, { min: 1, max: 3 });

            businessesData.push({
                name: businessName,
                description: faker.helpers.arrayElement(englishDescriptions),
                email: faker.internet.email({ firstName: owner.fname, provider: `${businessName.split(' ')[0].toLowerCase()}.test` }),
                phone: faker.phone.number('039#######'), // Melbourne landline format
                address: `${faker.location.streetAddress()}, ${locationInfo.area}, VIC ${locationInfo.postcode}`,
                rating: faker.number.float({ min: 2.5, max: 5, precision: 0.1 }),
                foodRating: faker.number.float({ min: 2.5, max: 5, precision: 0.1 }),
                serviceRating: faker.number.float({ min: 2.0, max: 5, precision: 0.1 }),
                ambienceRating: faker.number.float({ min: 2.0, max: 5, precision: 0.1 }),
                review_count: faker.number.int({ min: 0, max: 650 }),
                imageUrl: faker.image.urlLoremFlickr({ category: 'restaurant', width: 640, height: 480 }),
                images: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.image.urlLoremFlickr({ category: 'food', width: 640, height: 480 })),
                owner_id: owner._id,
                // price_range_id: null, // Add if you have PriceRange model seeded
                menuItems: generateMenuItems(selectedCuisines[0]), // Generate menu based on primary cuisine
                cuisines: selectedCuisines,
                openingHours: generateOpeningHours(),
            });
        }

        const createdBusinesses = await Business.insertMany(businessesData);
        console.log(`${createdBusinesses.length} businesses inserted.`);

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