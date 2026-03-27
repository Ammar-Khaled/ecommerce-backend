const {
    User,
    Category,
    Product,
    Review,
    SellerProfile,
} = require("./models");

const seedDatabase = async () => {
    const [userCount, categoryCount, productCount, reviewCount, sellerProfileCount] =
        await Promise.all([
            User.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments(),
            Review.countDocuments(),
            SellerProfile.countDocuments(),
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
                email: "admin@shop.local",
                phone: "01000000001",
                password: "admin123",
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
                email: "seller@shop.local",
                phone: "01000000002",
                password: "seller123",
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
                email: "customer@shop.local",
                phone: "01000000003",
                password: "customer123",
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

};

module.exports = seedDatabase;
