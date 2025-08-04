import express from 'express';
import path from 'path';
import { UUIDGet, UUIDPost } from './controller/UUID';
import { getLatestImage } from './controller/latest-image';
import { getObsidianData } from './controller/obsidian-data';
import { convertImage, uploadImage } from './controller/upload-image';
import { latestQuoteGet, latestQuotePost } from './controller/quote';
import { getScreenshot } from './controller/screenshot';
var cors = require('cors')

const app = express();

app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json());

app.use(cors());

app.get('/image-test', getLatestImage);

app.get('/uuid', UUIDGet)
app.post('/uuid', UUIDPost)

app.get('/obsidian-data', getObsidianData)

app.post('/upload', uploadImage('image'), convertImage);

app.post('/quote', latestQuotePost)
app.get('/quote', latestQuoteGet)

app.get('/screenshot', getScreenshot)

app.listen('3000', () => {
    console.log(`Server running at http://localhost:${3000}`);
});

export default app;