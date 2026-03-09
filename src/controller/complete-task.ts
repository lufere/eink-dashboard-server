import { Request, Response } from "express";
import { completeTask, moveExpiredTasks } from "./obsidian-data";

export const completeTaskPost = async (req: Request<{}, {title: string, type: string, date: string}>, res: Response) => {
    const updatedTasks = await completeTask(req.body.title, req.body.type, req.body.date)
    res.status(200).json({
        message: 'Succesfully completed task',
        updatedTasks,
    })
}