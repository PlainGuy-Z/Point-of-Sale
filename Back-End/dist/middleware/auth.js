import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from '../http/errors.js';
export const authenticateToken = (req, _res, next) => {
    const token = req.cookies?.token
        ?? req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = {
            id: decoded.sub,
            shop_id: decoded.shop_id,
            role: decoded.role,
            name: decoded.name,
            email: decoded.email,
            branch_id: decoded.branch_id ?? null,
        };
        next();
    }
    catch {
        next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }
};
