const jwt = require('jsonwebtoken');
const user = require('../Models/users');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await user.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists!"
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token or token expired" });
    }
};

// Optional auth: allows guest reporting if user is not logged in
const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await user.findById(decoded.id);
        } catch (err) {
            // Ignore invalid token and continue as guest
        }
    }

    next();
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, optionalProtect, authorize };