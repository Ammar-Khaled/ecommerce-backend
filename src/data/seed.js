const { User, Category, Product, Review, SellerProfile, Order } = require("./models");
const { getNextId } = require("./store");

const seedDatabase = async () => {
  const [userCount, categoryCount, productCount, reviewCount, sellerProfileCount] = await Promise.all([User.countDocuments(), Category.countDocuments(), Product.countDocuments(), Review.countDocuments(), SellerProfile.countDocuments()]);


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
        isVerified: true,
      },
      {
        id: 2,
        name: "Seller User",
        email: "seller@gmail.com",
        phone: "01000000002",
        password: "$2a$10$Yo1AQj/5XeqaUGgVzNwtluEn5pKMWUXU8kM1Qe5TvRwLqjvhf8qfK", // seller123
        role: "seller",
        address: "Alexandria",
        paymentDetails: [],
        wishlist: [],
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
      {
        id: 3,
        name: "Customer User",
        email: "customer@gmail.com",
        phone: "01000000003",
        password: "$2a$10$9NZd7CP7VdZr6TvOUd2kr.YWelJFSSR3vbZvSzTXQb2OA36.5CtjK", // customer123
        role: "customer",
        address: "Giza",
        paymentDetails: [],
        wishlist: [1],
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
    ]);
  }

  await User.updateMany(
    {
      email: { $in: ["admin@gmail.com", "seller@gmail.com", "customer@gmail.com"] },
    },
    {
      $set: { isVerified: true },
      $unset: { OTP: 1, OTPExpires: 1 },
    },
  );

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

  const customerOrders = await Order.find({ userId: 3 }).sort({ id: 1 }).lean();

  if (customerOrders.length < 1) {
    await Order.create({
      id: await getNextId(Order),
      userId: 3,
      guestInfo: null,
      ownerKey: "user:3",
      status: "placed",
      shippingStatus: "pending",
      paymentMethod: "cod",
      paymentStatus: "pending",
      shippingAddress: "Giza",
      currency: "USD",
      subtotal: 59.97,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 59.97,
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
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (customerOrders.length < 2) {
    await Order.create({
      id: await getNextId(Order),
      userId: 3,
      guestInfo: null,
      ownerKey: "user:3",
      status: "confirmed",
      shippingStatus: "processing",
      paymentMethod: "card",
      paymentStatus: "paid",
      shippingAddress: "Giza",
      currency: "USD",
      subtotal: 89.99,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 89.99,
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
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
};

module.exports = seedDatabase;
