const DEFAULT_OPTIONS = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
    stripUnknown: false,
};

const formatDetails = (details) => {
    return details.map((detail) => ({
        message: detail.message,
        path: detail.path.join("."),
        type: detail.type,
    }));
};

const validateRequest = (schemas = {}) => {
    return async (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.validateAsync(req.body, DEFAULT_OPTIONS);
            }

            if (schemas.query) {
                req.query = await schemas.query.validateAsync(req.query, DEFAULT_OPTIONS);
            }

            if (schemas.params) {
                req.params = await schemas.params.validateAsync(req.params, DEFAULT_OPTIONS);
            }

            return next();
        } catch (error) {
            if (error.isJoi) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: formatDetails(error.details),
                });
            }

            return next(error);
        }
    };
};

module.exports = validateRequest;
