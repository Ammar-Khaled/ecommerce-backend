const {
    User,
    Category,
    Product,
    Review,
    SellerProfile,
    Order,
} = require("./models");

const seedDatabase = async () => {
    const [userCount, categoryCount, productCount, reviewCount, sellerProfileCount, orderCount] =
        await Promise.all([
            User.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments(),
            Review.countDocuments(),
            SellerProfile.countDocuments(),
            Order.countDocuments(),
        ]);

    if (categoryCount === 0) {
        await Category.insertMany([
            { id: 1, name: "Apparel" },
            { id: 2, name: "Footwear" },
            { id: 3, name: "Accessories" },
        ]);
    }

    if (userCount === 0) {
        await User.insertMany([
            {
                id: 1,
                name: "Admin User",
                email: "admin@gmail.com",
                phone: "01000000001",
                password: "$2a$10$bIVubjJgoyZOAazrWuX0f.Daf8/zbgkTmL62n0upy7ZytFXi72nay", // admin123
                role: "admin",
                address: "Cairo",
                paymentDetails: [],
                wishlist: [],
                isActive: true,
                isDeleted: false,
            },
            {
                id: 2,
                name: "Seller User",
                email: "seller@gmail.com",
                phone: "01000000002",
                password: "$2a$10$Yo1AQj/5XeqaUGgVzNwtluEn5pKMWUXU8kM1Qe5TvRwLqjvhf8qfK",  // seller123
                role: "seller",
                address: "Alexandria",
                paymentDetails: [],
                wishlist: [],
                isActive: true,
                isDeleted: false,
            },
            {
                id: 3,
                name: "Customer User",
                email: "customer@gmail.com",
                phone: "01000000003",
                password: "$2a$10$9NZd7CP7VdZr6TvOUd2kr.YWelJFSSR3vbZvSzTXQb2OA36.5CtjK",  // customer123
                role: "customer",
                address: "Giza",
                paymentDetails: [],
                wishlist: [1],
                isActive: true,
                isDeleted: false,
            },
        ]);
    }

    if (productCount === 0) {
        await Product.insertMany([
            {
                id: 1,
                name: "Classic T-Shirt",
                description: "Soft cotton t-shirt for daily wear",
                price: 19.99,
                currency: "USD",
                categoryId: 1,
                stock: 50,
                sellerId: 2,
                images: ["https://picsum.photos/seed/shirt/640/480"],
            },
            {
                id: 2,
                name: "Slim Fit Jeans",
                description: "Comfort-stretch denim jeans",
                price: 49.99,
                currency: "USD",
                categoryId: 1,
                stock: 35,
                sellerId: 2,
                images: ["https://picsum.photos/seed/jeans/640/480"],
            },
            {
                id: 3,
                name: "Running Sneakers",
                description: "Breathable running shoes with foam cushioning",
                price: 89.99,
                currency: "USD",
                categoryId: 2,
                stock: 20,
                sellerId: 2,
                images: ["https://picsum.photos/seed/sneaker/640/480"],
            },
            {
                id: 4,
                name: "Leather Wallet",
                description: "Minimal wallet with RFID protection",
                price: 29.99,
                currency: "USD",
                categoryId: 3,
                stock: 40,
                sellerId: 2,
                images: ["https://picsum.photos/seed/wallet/640/480"],
            },
        ]);
    }

    if (reviewCount === 0) {
        await Review.insertMany([
            {
                id: 1,
                productId: 1,
                userId: 3,
                rating: 5,
                comment: "Great quality for the price",
                createdAt: new Date().toISOString(),
            },
        ]);
    }

    if (sellerProfileCount === 0) {
        await SellerProfile.insertMany([
            {
                id: 1,
                userId: 2,
                storeName: "Urban Style",
                payoutMethod: "bank-transfer",
                isApproved: true,
            },
        ]);
    }

    if (orderCount === 0) {
        await Order.insertMany([
            {
                id: 1,
                userId: 3,
                ownerKey: "order-key-1",
                status: "delivered",
                shippingStatus: "delivered",
                paymentMethod: "card",
                paymentStatus: "paid",
                shippingAddress: {
                    street: "123 Main St",
                    city: "Giza",
                    state: "Giza",
                    postalCode: "12345",
                    country: "Egypt",
                },
                currency: "EGP",
                subtotal: 109.98,
                discount: 0,
                tax: 10,
                shipping: 5,
                total: 124.98,
                items: [
                    {
                        productId: 1,
                        sellerId: 2,
                        name: "Classic T-Shirt",
                        quantity: 2,
                        unitPrice: 19.99,
                        lineTotal: 39.98,
                        availableStock: 50,
                    },
                    {
                        productId: 4,
                        sellerId: 2,
                        name: "Leather Wallet",
                        quantity: 1,
                        unitPrice: 29.99,
                        lineTotal: 29.99,
                        availableStock: 40,
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 2,
                userId: 3,
                ownerKey: "order-key-2",
                status: "processing",
                shippingStatus: "pending",
                paymentMethod: "cod",
                paymentStatus: "pending",
                shippingAddress: {
                    street: "456 Oak Ave",
                    city: "Giza",
                    state: "Giza",
                    postalCode: "12346",
                    country: "Egypt",
                },
                currency: "EGP",
                subtotal: 89.99,
                discount: 0,
                tax: 9,
                shipping: 5,
                total: 103.99,
                items: [
                    {
                        productId: 3,
                        sellerId: 2,
                        name: "Running Sneakers",
                        quantity: 1,
                        unitPrice: 89.99,
                        lineTotal: 89.99,
                        availableStock: 20,
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 3,
                userId: 3,
                ownerKey: "order-key-3",
                status: "shipped",
                shippingStatus: "shipped",
                paymentMethod: "card",
                paymentStatus: "paid",
                shippingAddress: {
                    street: "789 Elm St",
                    city: "Cairo",
                    state: "Cairo",
                    postalCode: "11111",
                    country: "Egypt",
                },
                currency: "EGP",
                subtotal: 99.97,
                discount: 10,
                tax: 9,
                shipping: 5,
                total: 103.97,
                items: [
                    {
                        productId: 2,
                        sellerId: 2,
                        name: "Slim Fit Jeans",
                        quantity: 2,
                        unitPrice: 49.99,
                        lineTotal: 99.97,
                        availableStock: 35,
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 4,
                userId: 3,
                ownerKey: "order-key-4",
                status: "pending_payment",
                shippingStatus: "pending",
                paymentMethod: "card",
                paymentStatus: "pending",
                shippingAddress: {
                    street: "321 Pine Rd",
                    city: "Alexandria",
                    state: "Alexandria",
                    postalCode: "21111",
                    country: "Egypt",
                },
                currency: "EGP",
                subtotal: 149.96,
                discount: 0,
                tax: 15,
                shipping: 10,
                total: 174.96,
                items: [
                    {
                        productId: 1,
                        sellerId: 2,
                        name: "Classic T-Shirt",
                        quantity: 3,
                        unitPrice: 19.99,
                        lineTotal: 59.97,
                        availableStock: 50,
                    },
                    {
                        productId: 4,
                        sellerId: 2,
                        name: "Leather Wallet",
                        quantity: 3,
                        unitPrice: 29.99,
                        lineTotal: 89.99,
                        availableStock: 40,
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 5,
                userId: 3,
                ownerKey: "order-key-5",
                status: "cancelled",
                shippingStatus: "cancelled",
                paymentMethod: "paypal",
                paymentStatus: "failed",
                shippingAddress: {
                    street: "555 Maple Dr",
                    city: "Giza",
                    state: "Giza",
                    postalCode: "12347",
                    country: "Egypt",
                },
                currency: "EGP",
                subtotal: 39.98,
                discount: 0,
                tax: 4,
                shipping: 0,
                total: 43.98,
                items: [
                    {
                        productId: 1,
                        sellerId: 2,
                        name: "Classic T-Shirt",
                        quantity: 2,
                        unitPrice: 19.99,
                        lineTotal: 39.98,
                        availableStock: 50,
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ]);
    }

};

module.exports = seedDatabase;
