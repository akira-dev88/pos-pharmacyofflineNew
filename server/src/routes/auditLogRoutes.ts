import {
  Router
} from 'express';

import {
  AuditLogController
} from '../controllers/AuditLogController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['owner', 'manager']));

router.get(
  '/',
  AuditLogController.getAll
);

export default router;