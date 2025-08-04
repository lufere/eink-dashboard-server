import { Request, Response } from "express";
import { getCurrentQuote, updateQuote } from "../model/quote.model";

export const latestQuotePost = async (_req: Request, res: Response) => {
    try {
        await updateQuote()
        res.send('quote')
    } catch(e) {
        console.log('Faisled to load/parse DB', e);
        res.end('Error getting latest quote')
    }
}

export const latestQuoteGet = async (_req: Request, res: Response) => {
    try {
        const quote = await getCurrentQuote()
        res.send(quote)
    } catch(e) {
        console.log('Failed to load/parse DB', e);
        res.end('Errorr getting latest quote')
    }
}