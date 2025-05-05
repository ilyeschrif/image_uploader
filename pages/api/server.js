import nextConnect from 'next-connect';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import cors from 'cors'; // Add CORS middleware

const upload = multer();

const API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const API_URL = 'https://freeimage.host/api/1/upload';

const handler = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: `Server error: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

handler.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type'],
}));

handler.use(upload.single('source'));

handler.post(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const form = new FormData();
    form.append('key', API_KEY);
    form.append('action', 'upload');
    form.append('format', 'json');
    form.append('source', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(API_URL, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const data = response.data;

    if (data.status_code === 200) {
      res.status(200).json({
        success: true,
        image_url: data.image.url,
        thumbnail_url: data.image.thumb.url,
        viewer_url: data.image.url_viewer,
      });
    } else {
      res.status(500).json({ error: data.status_txt || 'Upload failed', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};