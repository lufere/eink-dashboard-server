const multer = require('multer');
const fs = require('fs');
const imagemagickCli = require('imagemagick-cli');
import { Response } from 'express';
import path from 'path';

const storage = multer.diskStorage({
	destination: function (_req: any, _file: any, cb: any) {
	  const uploadPath = './uploads';
	  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
	  cb(null, uploadPath);
	},
	filename: function (req: any, file: any, cb: any) {
	  const uniqueName = file.originalname;
	  cb(null, uniqueName);
	}
});

const upload = multer({ storage });

export const uploadImage = (path: string) => {
    return upload.single(path)
}

export const convertImage = async (req: any, res: Response) => {
	const inputPath = './uploads/canvas.png';
	const outputPath = path.join('./converted', `converted.bmp`);
  
	try {
	  fs.mkdirSync('converted', { recursive: true });
	  console.log('Starting conversion')
	  imagemagickCli
		.exec(`magick ${inputPath} -resize 800x480! -remap ./src/controller/palette.png -dither FloydSteinberg -colors 4 gif:- | magick gif:- -depth 4 -define bmp:format=BMP3 BMP3:${outputPath}`)
		// .exec(`cat ${inputPath} | convert png:- -resize 800x480! -dither FloydSteinberg -remap ./src/controller/palette.png -type Palette -depth 4 -define bmp:format=BMP3 bmp:- > ${outputPath}`)
		.then(({ stdout, _stderr }: any) => {
			console.log(`Output: ${stdout}`);
		});
	  console.log('Done!')
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ error: 'Conversion failed' });
	} finally {
		res.json({ message: 'PNG uploaded successfully', file: req.file.filename });
	}
  }