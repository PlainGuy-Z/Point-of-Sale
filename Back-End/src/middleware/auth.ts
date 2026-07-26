import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from '../http/errors.js';

// Extend Express Request to include authenticated user info
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        shop_id: string;
        role: 'owner' | 'cashier';
        name: string;
        email: string;
        branch_id?: string | null;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  shop_id: string;
  role: 'owner' | 'cashier';
  name: string;
  email: string;
  branch_id?: string | null;
}

export const authenticateToken: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token
    ?? req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.sub,
      shop_id: decoded.shop_id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
      branch_id: decoded.branch_id ?? null,
    };

    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
};
