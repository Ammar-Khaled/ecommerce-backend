const Joi = require("joi");

const positiveId = Joi.number().integer().positive();
const nonNegativeNumber = Joi.number().min(0);
const nameSchema = Joi.string().trim().min(2).max(100);
const optionalString = Joi.string().trim().max(2000);
const mixedField = Joi.alternatives().try(Joi.object().unknown(true), Joi.array(), Joi.string(), Joi.number(), Joi.boolean()).allow(null);

const authSchemas = {
  register: Joi.object({
    name: nameSchema.required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().min(7).max(20).allow(null),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid("customer", "seller", "admin").default("customer"),
  }).unknown(false),
  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required(),
  }).unknown(false),
  verifyEmail: Joi.object({
    email: Joi.string().trim().email().required(),
    code: Joi.alternatives()
      .try(Joi.string().pattern(/^\d{6}$/), Joi.number().integer().min(100000).max(999999))
      .required(),
  }).unknown(false),
  forgotPassword: Joi.object({
    email: Joi.string().trim().email().required(),
  }).unknown(false),
  resetPasswordParams: Joi.object({
    token: Joi.string().hex().length(64).required(),
  }).unknown(false),
  resetPasswordBody: Joi.object({
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  }).unknown(false),
  resetPasswordBodyWithToken: Joi.object({
    token: Joi.string().hex().length(64).required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  }).unknown(false),
};

const userSchemas = {
  patchMe: Joi.object({
    name: nameSchema,
    address: optionalString.max(255),
    paymentDetails: Joi.array().items(Joi.any()),
    phone: Joi.string().trim().min(7).max(20),
  })
    .min(1)
    .unknown(false),
  productIdParam: Joi.object({
    productId: positiveId.required(),
  }).unknown(false),
};

const productSchemas = {
  listQuery: Joi.object({
    q: Joi.string().trim().max(200),
    categoryId: positiveId,
    minPrice: nonNegativeNumber,
    maxPrice: nonNegativeNumber,
    inStock: Joi.boolean(),
    sellerId: positiveId,
    limit: Joi.number().integer().min(1).max(100),
    sort: Joi.string().valid("price-asc", "price-desc", "name-asc"),
  }).unknown(false),
  idParam: Joi.object({
    id: positiveId.required(),
  }).unknown(false),
  createProduct: Joi.object({
    name: nameSchema.required(),
    description: Joi.string().trim().max(2000).default(""),
    price: nonNegativeNumber.required(),
    categoryId: positiveId.required(),
    stock: Joi.number().integer().min(0).default(0),
    images: Joi.array().items(Joi.string().trim().min(1)).default([]),
  }).unknown(false),
  updateStock: Joi.object({
    stock: Joi.number().integer().min(0).required(),
  }).unknown(false),
  reviewBody: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(2000).default(""),
  }).unknown(false),
};

const cartSchemas = {
  guestQuery: Joi.object({
    guestId: Joi.string().trim().min(1).max(100),
  }).unknown(false),
  addItemBody: Joi.object({
    productId: positiveId.required(),
    quantity: Joi.number().integer().min(1).default(1),
    guestId: Joi.string().trim().min(1).max(100),
  }).unknown(false),
  updateItemParams: Joi.object({
    productId: positiveId.required(),
  }).unknown(false),
  updateItemBody: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    guestId: Joi.string().trim().min(1).max(100),
  }).unknown(false),
  removeItemParams: Joi.object({
    productId: positiveId.required(),
  }).unknown(false),
  checkoutBody: Joi.object({
    paymentMethod: Joi.string().valid("card", "paypal", "cod", "wallet").default("cod"),
    shippingAddress: mixedField,
    guestInfo: mixedField,
    guestId: Joi.string().trim().min(1).max(100),
  }).unknown(false),
};

const orderSchemas = {
  idParam: Joi.object({
    id: positiveId.required(),
  }).unknown(false),
  updateStatusBody: Joi.object({
    status: Joi.string().valid("placed", "confirmed", "processing", "shipped", "delivered", "cancelled").required(),
  }).unknown(false),
};

const paymentSchemas = {
  createIntent: Joi.object({
    orderId: positiveId.required(),
  }).unknown(false),
  webhookBody: Joi.object().unknown(true),
  orderIdParam: Joi.object({
    orderId: positiveId.required(),
  }).unknown(false),
};

const sellerSchemas = {
  register: Joi.object({
    storeName: Joi.string().trim().min(2).max(120).required(),
    payoutMethod: Joi.string().trim().min(2).max(50).default("bank-transfer"),
  }).unknown(false),
  profileUpdate: Joi.object({
    storeName: Joi.string().trim().min(2).max(120),
    payoutMethod: Joi.string().trim().min(2).max(50),
    isApproved: Joi.boolean(),
  })
    .min(1)
    .unknown(false),
  productIdParam: Joi.object({
    id: positiveId.required(),
  }).unknown(false),
  createProduct: Joi.object({
    name: nameSchema.required(),
    description: Joi.string().trim().max(2000).default(""),
    price: nonNegativeNumber.required(),
    categoryId: positiveId.required(),
    stock: Joi.number().integer().min(0).default(0),
    images: Joi.array().items(Joi.string().trim().min(1)).default([]),
  }).unknown(false),
  updateProduct: Joi.object({
    name: nameSchema,
    description: Joi.string().trim().max(2000),
    price: nonNegativeNumber,
    stock: Joi.number().integer().min(0),
    categoryId: positiveId,
    isActive: Joi.boolean(),
    images: Joi.array().items(Joi.string().trim().min(1)),
  })
    .min(1)
    .unknown(false),
  updateProductStatus: Joi.object({
    isActive: Joi.boolean().required(),
  }).unknown(false),
};

const adminSchemas = {
  userIdParam: Joi.object({
    id: positiveId.required(),
  }).unknown(false),
  restrictUserBody: Joi.object({
    isActive: Joi.boolean().required(),
  }).unknown(false),
  createCategory: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
  }).unknown(false),
  createProduct: Joi.object({
    name: nameSchema.required(),
    description: Joi.string().trim().max(2000).default(""),
    price: nonNegativeNumber.required(),
    categoryId: positiveId.required(),
    stock: Joi.number().integer().min(0).default(0),
    sellerId: positiveId,
  }).unknown(false),
  orderShipping: Joi.object({
    shippingStatus: Joi.string().trim().min(1).max(50),
  }).unknown(false),
};

const notificationSchemas = {
  sendEmailNotification: Joi.object({
    userId: positiveId.required(),
    subject: Joi.string().trim().min(1).max(200),
    message: Joi.string().trim().min(1).max(2000),
  }).unknown(false),
};

module.exports = {
  authSchemas,
  userSchemas,
  productSchemas,
  cartSchemas,
  orderSchemas,
  paymentSchemas,
  sellerSchemas,
  adminSchemas,
  notificationSchemas,
};
