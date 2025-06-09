import express from 'express';
import {
  getAllEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { getEventRegistrations } from '../controllers/registrationController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.route('/')
  .get(getAllEvents)
  .post(createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

router.get('/:eventId/registrations', getEventRegistrations);

export default router; 