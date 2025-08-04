import { Request, Response } from "express";

const fs = require('fs').promises;

const imageLocation = './converted/converted.bmp'

export const getLatestImage = async (_req: Request, res: Response) => {
    try {
        const data = await fs.readFile(imageLocation)
        res.writeHead(200, {
            'Content-Type': 'image/bmp',
            'Content-Length': data.length
        });
        res.end(data, 'binary');
    } catch (e) {
        console.error('Error reading BMP file:', e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading BMP file.');
        return;
    }
}
