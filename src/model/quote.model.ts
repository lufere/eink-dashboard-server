import { QUOTE_UPDATE_INTERVAL, ROUTE_TO_OBSIDIAN } from "../constants/constants";
import { getLocalDB } from "./utils";
import { differenceInHours } from 'date-fns';

const fs = require('fs').promises;

const checkIfQuoteExpired = (lastUpdatedAt: string) => {
    const hourDiff = differenceInHours(new Date(), lastUpdatedAt)
    if(hourDiff > QUOTE_UPDATE_INTERVAL) return true
    return false
}

export const updateQuote = async () => {
    const data = await getLocalDB();
    const quotesFile = await fs.readFile(`${ROUTE_TO_OBSIDIAN}/Quotes/Quotes.md`, 'utf8');
    const quotes = quotesFile.split('\n');
    const randomIndex = Math.floor(Math.random() * quotes.length)
    const quote = quotes[randomIndex]
    const currentDate = new Date();
    checkIfQuoteExpired(data.quote.lastUpdatedAt);
    const newData = {
        ...data,
        quote: {
            text: quote,
            lastUpdatedAt: currentDate,
        },
    }
    const json = JSON.stringify(newData);
    await fs.writeFile('./src/model/localDB.json', json, 'utf8');
    return data.quote.text;
}

export const getCurrentQuote = async ()  => {
    const db = await getLocalDB()
    return db.quote.text;
}