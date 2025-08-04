import { getLocalDB } from "./utils";

const fs = require('fs').promises;

export const updateUUID = async (uuid: string) => {
    const data = await getLocalDB()
    const newData = {
        ...data,
        uuid,
    }
    const json = JSON.stringify(newData);
    await fs.writeFile('./src/model/localDB.json', json, 'utf8');
}

export const getCurrentUUID = async () => {
    const data = await getLocalDB()
    return data.uuid;
}