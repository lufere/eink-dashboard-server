const fs = require('fs').promises;
import { Request, Response } from "express";
import { getCurrentUUID, updateUUID } from "../model/UUID.model";

interface PostRequest extends Express.Request {
    body: {
        uuid: string
    }
}

export const UUIDPost = async (req: PostRequest, res: Response<string>) => {
	try {
		const { uuid } = req.body
		await updateUUID(uuid);
		res.send(uuid)
		
	} catch(e) {
		console.log('Failed to write to DB', e);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Error loading BMP file.');
		return;
	}
}

export const UUIDGet = async (_req: Request, res: Response<string>) => {
    try {
		const uuid = await getCurrentUUID()
        res.send(uuid)		
    } catch(e) {
        console.log('Failed to load/parse DB', e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading BMP file.');
        return;
    }
}