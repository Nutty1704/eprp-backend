import express from 'express';
import { getCuisineSummary } from '../controllers/cuisine.controller.js'; 

const router = express.Router();

// GET /api/cuisines/summary
router.get('/summary', getCuisineSummary);

export default router;