const bcrypt = require("bcryptjs");
const { User, SellerProfile, RevokedToken } = require("../data/models");
const { getNextId } = require("../data/store");
const { JWT_EXPIRES_IN, signAccessToken, getTokenFromRequest, verifyAccessToken } = require("../utils/jwt.utils");

const VALID_ROLES = ["customer", "seller", "admin"];
const BCRYPT_ROUNDS = 10;

const sanitizeUser = (userDoc) => {
    if (!userDoc) {
        return null;
    }

    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete user.__v;
    delete user._id;
    delete user.password;
    return user;
};

const register = async (req, res) => {
    const { name, email, phone, password, role = "customer" } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "name, email, and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
        return res.status(409).json({ message: "Email already exists" });
    }

    const normalizedRole = VALID_ROLES.includes(role) ? role : "customer";

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await User.create({
        id: await getNextId(User),
        name,
        email: normalizedEmail,
        phone: phone || null,
        password: hashedPassword,
        role: normalizedRole,
        address: null,
        paymentDetails: [],
        wishlist: [],
        isActive: true,
        isDeleted: false,
    });

    if (normalizedRole === "seller") {
        await SellerProfile.create({
            id: await getNextId(SellerProfile),
            userId: newUser.id,
            storeName: `${name} Store`,
            payoutMethod: "pending",
            isApproved: false,
        });
    }

    const token = signAccessToken(newUser);

    return res.status(201).json({
        message: "User registered successfully. Confirmation email flow is pending integration.",
        token,
        tokenType: "Bearer",
        expiresIn: JWT_EXPIRES_IN,
        user: sanitizeUser(newUser),
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({
        email: String(email).toLowerCase(),
        isActive: true,
        isDeleted: false,
    });

    if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials or inactive account" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials or inactive account" });
    }

    const token = signAccessToken(user);

    return res.json({
        message: "Login successful",
        token,
        tokenType: "Bearer",
        expiresIn: JWT_EXPIRES_IN,
        user: sanitizeUser(user),
    });
};

const logout = async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.status(400).json({ message: "No token provided" });
    }

    try {
        verifyAccessToken(token);

        await RevokedToken.create({ token });

        return res.json({ message: "Logged out" });
    } catch (error) {
        if (error && error.name === "TokenExpiredError") {
            return res.json({ message: "Token already expired)" });
        }
        // JsonWebTokenError
        return res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = {
    register,
    login,
    logout,
};
