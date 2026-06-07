import { Router } from 'express';

import {
    ProductTemplateController
} from '../controllers/ProductTemplateController';

import {
    authenticate
} from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
    '/',
    ProductTemplateController.create
);

router.get(
    '/',
    ProductTemplateController.index
);

router.get(
    '/:uuid',
    ProductTemplateController.show
);

router.put(
    '/:uuid',
    ProductTemplateController.update
);

router.delete(
    '/:uuid',
    ProductTemplateController.destroy
);

export default router;