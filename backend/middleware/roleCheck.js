// Role-based access control middleware
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (!roles.includes(req.user.activeRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This endpoint requires one of: [${roles.join(', ')}] role. Your active role is: ${req.user.activeRole}`,
            });
        }

        next();
    };
};

// Ensure user actually has the role in their roles array (not just activeRole)
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const userRoles = req.user.roles || [];
        const hasAny = roles.some((r) => userRoles.includes(r));

        if (!hasAny) {
            return res.status(403).json({
                success: false,
                message: `Access denied. You do not have the required role.`,
            });
        }

        next();
    };
};

module.exports = { requireRole, hasRole };
