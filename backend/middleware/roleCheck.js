// Role-based access control middleware
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        // Allow if user's active role matches
        if (roles.includes(req.user.activeRole)) {
            return next();
        }

        // If the endpoint requires admin, allow if the user has the 'admin' role in their roles array
        if (roles.includes('admin') && req.user.roles && req.user.roles.includes('admin')) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. This endpoint requires one of: [${roles.join(', ')}] role. Your active role is: ${req.user.activeRole}`,
        });
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
