const roleChecker = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !requiredRole.includes(req.user.role)) {
            const err = new Error('Forbidden: Insufficient permissions');
            err.statusCode = 403;
            return next(err);
        }
        next();
    };
};

export default roleChecker;