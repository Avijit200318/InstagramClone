const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage(); // Store images in memory instead of the filesystem

const upload = multer({ storage: storage });

module.exports = upload;
