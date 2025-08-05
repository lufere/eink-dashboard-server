const fs = require('fs').promises;

interface localDB {
    uuid: string
    quote: {
        text: string
        lastUpdatedAt: string
    }
    latestData: string
}

export const getLocalDB = async () => {
    const db = await fs.readFile('./src/model/localDB.json', 'utf8');
    const data: localDB = JSON.parse(db);
    return data
}