import express from 'express';
import {
  createRegistration,
  getUserRegistrations,
  updateRegistration,
  // checkIn
} from '../controllers/registrationController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.route('/')
    .post(createRegistration)
    .get(getUserRegistrations);

router.put('/:registrationId', updateRegistration);
// router.put('/:registrationId/checkin', checkIn);

export default router; 