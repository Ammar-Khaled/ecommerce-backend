const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const getTokenFromRequest = (req) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(" ");
    if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
        return null;
    }

    return token;
};

const signAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            email: user.email,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    JWT_EXPIRES_IN,
    getTokenFromRequest,
    signAccessToken,
    verifyAccessToken,
};
