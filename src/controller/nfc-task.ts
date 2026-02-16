import { NextFunction, Request, Response } from "express"
import { taskMappingKey } from "../constants/NFC-mappings"
import { addNewNFCTask } from "./obsidian-data"

export const createNFCTask = async(
    req:Request<{}, {}, {}, {task: string}>,
    res: Response,
    next: NextFunction
) => {
    try {
        const queryTask = req.query.task as taskMappingKey
        const task = await addNewNFCTask(queryTask)
        res.status(200).json({
            message: 'Succesfully created NFC task',
            task,
        })
    } catch (e) {
        console.log('Could not create new NFC task:', e);
        next(e)
    }
}