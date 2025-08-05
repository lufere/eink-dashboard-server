import { getLocalDB } from './utils';

const fs = require('fs').promises;

export const updateLatestData = async (latestData: string) => {
	const db = await getLocalDB();
	const newDB = {
		...db,
		latestData,
	};
	const json = JSON.stringify(newDB);
	await fs.writeFile('./src/model/localDB.json', json, 'utf8');
};

export const getLatestData = async () => {
	const data = await getLocalDB();
	return data.latestData;
};
