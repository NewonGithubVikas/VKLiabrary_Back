// middleware/upload.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary (put your credentials in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'vkliabrary/members',         // organized folder
      allowed_formats: ['jpg', 'jpeg', 'png'],
      transformation: [
        { quality: 'auto:good' },           // auto-optimize quality
        { fetch_format: 'auto' },           // convert to webp/avif when possible
      ],
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter,
});

const uploadMemberImages = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'additionalPhotos', maxCount: 3 },
]);

module.exports = uploadMemberImages;