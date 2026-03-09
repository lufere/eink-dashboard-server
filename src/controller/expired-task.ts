import { Request, Response } from "express";
import { moveExpiredTasks } from "./obsidian-data";

export const expiredTaskPost = async (_req: Request, res: Response) => {
    try {
        const updatedTasks = await moveExpiredTasks()
        res.status(200).json({
            message: 'Succesfully moved forward expired tasks',
            updatedTasks,
        })
    } catch(e) {
        console.log('Failed to update expired tasks', e);
        res.end('Error updating expired tasks')
    }
}