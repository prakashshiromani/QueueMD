const express = require('express');
const { uploadImage } = require('../controllers/upload.controller');
const { auth } = require('../middleware/auth.middleware');
const upload = require('../middleware/multer');

const router = express.Router();

router.post('/', auth, upload.single('image'), uploadImage);

module.exports = router;
