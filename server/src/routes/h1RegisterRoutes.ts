import {
  Router
} from 'express';

import {
  H1RegisterController
} from '../controllers/H1RegisterController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// =========================
// LIST ALL
// =========================

router.get(
  '/',
  H1RegisterController.getAll
);

// =========================
// DATE RANGE
// =========================

router.get(
  '/date-range',
  H1RegisterController.getByDateRange
);

export default router;