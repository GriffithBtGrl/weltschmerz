const cloudinary = require('../config/cloudinary');

const uploadImage = async (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'weltschmerz',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        max_bytes: 5 * 1024 * 1024, // 5MB
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, deleteImage };