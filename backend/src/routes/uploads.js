import express from 'express';
import { getUploadUrl, setUploadValidation } from '../controllers/uploads.js';

const router = express.Router();

router.post('/validate', setUploadValidation);
router.post('/:route', getUploadUrl);

export default router;