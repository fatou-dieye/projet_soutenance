// photo.service.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

class PhotoService {
  constructor(uploadDir = 'public/uploads') {
    this.uploadDir = uploadDir;
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Configuration de multer
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      }
    });
    
    this.limits = {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 4
    };
    
    this.fileFilter = (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Format de fichier non supporté. Veuillez télécharger des images JPEG, PNG ou WebP.'));
      }
    };
    
    this.upload = multer({
      storage: this.storage,
      limits: this.limits,
      fileFilter: this.fileFilter
    });
  }
  
  // Méthode pour compresser une seule image
  async compressImage(file, options = {}) {
    const {
      width = 800,
      quality = 80,
      format = 'jpeg'
    } = options;
    
    const fileName = path.basename(file.path);
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const compressedFileName = `${baseName}-compressed.jpg`;
    const compressedPath = path.join(this.uploadDir, compressedFileName);
    
    try {
      // Traitement de l'image avec sharp
      await sharp(file.path)
        .resize(width)
        [format]({ quality })
        .toFile(compressedPath);
      
      // Supprimer l'original si nécessaire
      fs.unlinkSync(file.path);
      
      return {
        originalName: file.originalname,
        fileName: compressedFileName,
        path: compressedPath,
        url: `/uploads/${compressedFileName}`,
        size: fs.statSync(compressedPath).size,
      };
    } catch (error) {
      console.error('Erreur lors de la compression de l\'image:', error);
      throw error;
    }
  }
  
  // Méthode pour traiter plusieurs images uploadées
  async processUploadedImages(files, options = {}) {
    if (!files || files.length === 0) {
      return [];
    }
    
    const processedImages = [];
    
    for (const file of files) {
      const processedImage = await this.compressImage(file, options);
      processedImages.push(processedImage);
    }
    
    return processedImages;
  }
  
  // Méthode pour créer une miniature
  async createThumbnail(imagePath, options = {}) {
    const {
      width = 200,
      height = 200,
      quality = 70
    } = options;
    
    const fileExt = path.extname(imagePath);
    const baseName = path.basename(imagePath, fileExt);
    const thumbnailFileName = `${baseName}-thumb.jpg`;
    const thumbnailPath = path.join(this.uploadDir, thumbnailFileName);
    
    try {
      await sharp(imagePath)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality })
        .toFile(thumbnailPath);
      
      return {
        fileName: thumbnailFileName,
        path: thumbnailPath,
        url: `/uploads/${thumbnailFileName}`
      };
    } catch (error) {
      console.error('Erreur lors de la création de la miniature:', error);
      throw error;
    }
  }
  
  // Méthode pour supprimer une image
  deleteImage(imagePath) {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      throw error;
    }
  }
  
  // Middleware pour l'upload d'images
  getUploadMiddleware() {
    return this.upload.array('photos', this.limits.files);
  }
  
  // Middleware pour traiter et compresser les images après upload
  getProcessingMiddleware() {
    return async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          return next();
        }
        
        const processedImages = await this.processUploadedImages(req.files);
        req.processedImages = processedImages;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = PhotoService;