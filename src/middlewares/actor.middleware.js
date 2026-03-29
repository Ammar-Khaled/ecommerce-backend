const { User, RevokedToken } = require("../data/models");
const { getTokenFromRequest, verifyAccessToken } = require("../utils/jwt.utils");

const attachGuestActor = (req, next) => {
    req.actor = {
        isAuthenticated: false,
        role: "guest",
    };

    return next();
};

const attachActor = async (req, _res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (token) {
            const revoked = await RevokedToken.findOne({ token }).lean();
            if (revoked) {
                return attachGuestActor(req, next);
            }

            const payload = verifyAccessToken(token);
            const user = await User.findOne({
                id: Number(payload.userId),
                isActive: true,
                isDeleted: false,
            }).lean();

            if (user) {
                req.actor = {
                    isAuthenticated: true,
                    userId: user.id,
                    role: user.role,
                    user,
                    tokenPayload: payload,
                };
                return next();
            }
        }

        return attachGuestActor(req, next);
    } catch (error) {
        if (error && error.name === "JsonWebTokenError") {
            return attachGuestActor(req, next);
        }

        if (error && error.name === "TokenExpiredError") {
            return attachGuestActor(req, next);
        }

        return next(error);
    }
};

module.exports = attachActor;
