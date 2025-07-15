// middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage(); // or use diskStorage for temp saving
const upload = multer({ storage });

export default upload;
