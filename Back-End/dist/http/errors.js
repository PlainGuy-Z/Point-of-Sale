import { ZodError } from 'zod';
export class HttpError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
export function notFoundHandler(_req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request body',
                details: err.flatten()
            }
        });
        return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
