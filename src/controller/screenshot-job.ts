import { getLatestData, updateLatestData } from '../model/latest-data.model';
import { parseObsidianTasks } from './obsidian-data';
import { convertImage, storeScreenshot, takeScreenshot } from './screenshot';

export const screenshotJob = async () => {
	console.log('Starting screenshot job');
	const baseUrl = 'http://192.168.1.12:5173/';
	const previousData = await getLatestData();
	const currentData = await parseObsidianTasks();
	const currentDataString = JSON.stringify(currentData);
	if (currentDataString === previousData)
		return console.log('Data has not changed, stopping job');
	try {
		const screenshot = await takeScreenshot(baseUrl);
		await storeScreenshot(screenshot);
		await convertImage();
		await updateLatestData(currentDataString);
	} catch (e) {
		console.error('Scheduled Job failed', e);
	}
};
