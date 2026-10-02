import { Router } from 'express';
import {
  listShares,
  shareDocument,
  revokeShare,
  shareDocumentSchema,
  revokeShareSchema,
} from '../controllers/share.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireDocumentRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router({ mergeParams: true });

router.use(authenticateJwt);

// Document collaborators
router.get('/', requireDocumentRole('VIEWER'), listShares);
router.post('/', requireDocumentRole('OWNER'), validateRequest(shareDocumentSchema), shareDocument);
router.delete('/', requireDocumentRole('OWNER'), validateRequest(revokeShareSchema), revokeShare);

export default router;
