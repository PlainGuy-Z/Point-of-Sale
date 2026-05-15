import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../http/validate.js';
import { HttpError } from '../http/errors.js';
export const printerRouter = Router();
const TestSchema = z.object({ ip: z.string().min(1) });
const PrintSchema = z.object({
    ip: z.string().min(1),
    content: z.string().min(1)
});
// POST /printer/test
// Test RawBT connection by sending ping
printerRouter.post('/test', validateBody(TestSchema), async (req, res, next) => {
    try {
        const { ip } = req.body;
        const targetIp = ip.includes(':') ? ip : `${ip}:40213`;
        const url = `http://${targetIp}/rawbt`;
        // Send minimal ESC/POS: just initialize + cut
        const testContent = '\x1B\x40' + // Initialize
            'SmartPOS Test Print\n' +
            '====================\n' +
            'Printer terhubung!\n\n\n' +
            '\x1D\x56\x41'; // Cut paper
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: testContent,
            signal: AbortSignal.timeout(5000), // 5s timeout
        });
        if (!response.ok) {
            throw new HttpError(502, 'PRINTER_ERROR', 'RawBT merespons dengan error');
        }
        res.json({ success: true, message: 'Printer terhubung' });
    }
    catch (err) {
        if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
            next(new HttpError(503, 'PRINTER_UNREACHABLE', 'Tidak dapat terhubung ke RawBT. Pastikan RawBT aktif.'));
            return;
        }
        next(err);
    }
});
// POST /printer/print
// Forward print job to RawBT
printerRouter.post('/print', validateBody(PrintSchema), async (req, res, next) => {
    try {
        const { ip, content } = req.body;
        const targetIp = ip.includes(':') ? ip : `${ip}:40213`;
        const url = `http://${targetIp}/rawbt`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: content,
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new HttpError(502, 'PRINTER_ERROR', 'Gagal mengirim ke printer');
        }
        res.json({ success: true });
    }
    catch (err) {
        if (err.name === 'TimeoutError') {
            next(new HttpError(503, 'PRINTER_TIMEOUT', 'Printer timeout'));
            return;
        }
        next(err);
    }
});
