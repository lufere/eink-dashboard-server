import path from "path";
import puppeteer from "puppeteer";
const imagemagickCli = require("imagemagick-cli");
const fs = require("fs").promises;
import { Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { updateUUID } from "../model/UUID.model";

export const getScreenshot = async (req: Request, res: Response) => {
	const baseUrl = "http://192.168.1.12:5173/";
	const screenshot = await takeScreenshot(baseUrl);
	await storeScreenshot(res, screenshot);
	await convertImage(res);
};

const takeScreenshot = async (url: string) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url);
	await page.waitForNetworkIdle();

	return await page.screenshot({
		fullPage: false,
		clip: {
			x: 0,
			y: 0,
			width: 860,
			height: 480,
		},
	});
};

const storeScreenshot = async (
	res: Response,
	screenshot: Uint8Array<ArrayBufferLike>,
) => {
	const filename = `latest-image.png`;
	const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");
	const filePath = path.join(uploadsDirectory, filename);
	await fs.mkdir(uploadsDirectory, { recursive: true });

	try {
		await fs.writeFile(filePath, screenshot);
		console.log(
			"Succesfully wrote image at:",
			path.join(uploadsDirectory, filename),
		);
	} catch (e) {
		console.error("PNG upload failed", e);
		res.status(500).json({ error: "PNG upload failed" });
	}
};

const convertImage = async (res: Response) => {
	const inputPath = "./uploads/latest-image.png";
	const outputPath = path.join("./converted", `converted.bmp`);
	try {
		await fs.mkdir("converted", { recursive: true });
		console.log("Starting conversion");
		imagemagickCli
			.exec(
				`magick ${inputPath} -resize 800x480! -remap ./src/controller/palette.png -dither FloydSteinberg -colors 4 gif:- | magick gif:- -depth 4 -define bmp:format=BMP3 BMP3:${outputPath}`,
			)
			.then(
				({ stdout, _stderr }: { stdout: string; _stderr: string }) => {
					console.log(`Output: ${stdout}`);
				},
			);
		console.log("Done!");
		const uuid = uuidv4()
		await updateUUID(uuid)
		res.status(200).send({
			message: "Image successfully saved!",
			filename: outputPath,
		});
	} catch (e) {
		console.error("PNG conversion to BMP failed", e);
		res.status(500).json({ error: "PNG conversion to BMP failed" });
	}
};
