const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'public', 'images'));
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4(); // Generate the UUID
        const extension = path.extname(file.originalname);
        const finalFilename = `${uniqueId}${extension}`;

        cb(null, finalFilename);
    }
});

const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'data', 'csv'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filename with timestamp
    }
});

// Create a file filter to restrict uploads to images only
const imageFilter = (req, file, cb) => {
    // 1. Define allowed extensions and MIME types
    const allowedTypes = /jpeg|jpg|png/;

    // 2. Check the extension
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // 3. Check the MIME type
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
        return cb(null, true); // Accept the file
    } else {
        return cb(new Error('Invalid file type. Only images are allowed!'), false); // Reject the file
    }
};

const csvFilter = (req, file, cb) => {
    const allowedTypes = /csv/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);
    if (isValidExt && isValidMime) {
        return cb(null, true);
    } else {
        return cb(new Error('Invalid file type. Only CSV files are allowed!'), false);
    }
};

const uploadCSV = multer({
    storage: csvStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: csvFilter
});


const uploadImages = multer({
    storage: imageStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 //2MB
    },
    fileFilter: imageFilter
});


module.exports = { uploadImages, uploadCSV };