import { HttpError } from '../http/errors.js';
/**
 * Dynamically require a specific role.
 */
export const requireRole = (role) => {
    return (req, _res, next) => {
        if (!req.user || req.user.role !== role) {
            return next(new HttpError(403, 'FORBIDDEN', `You do not have permission to access this resource`));
        }
        next();
    };
};
/**
 * Only allow users with role === 'owner'.
 */
export const requireOwner = (req, _res, next) => {
    if (!req.user || req.user.role !== 'owner') {
        return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
    }
    next();
};
/**
 * Allow both 'owner' and 'cashier' roles.
 * Effectively just ensures the user is authenticated with a valid role.
 */
export const requireCashier = (req, _res, next) => {
    if (!req.user || (req.user.role !== 'owner' && req.user.role !== 'cashier')) {
        return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
    }
    next();
};
