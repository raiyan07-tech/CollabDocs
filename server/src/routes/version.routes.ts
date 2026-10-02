import { Router } from 'express';
import {
  listVersions,
  createVersion,
  restoreVersion,
  createVersionSchema,
} from '../controllers/version.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireDocumentRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router({ mergeParams: true });

router.use(authenticateJwt);

router.get('/', requireDocumentRole('VIEWER'), listVersions);
router.post('/', requireDocumentRole('EDITOR'), validateRequest(createVersionSchema), createVersion);
router.post('/:versionId/restore', requireDocumentRole('EDITOR'), restoreVersion);

export default router;
