import { Router } from 'express';
import {
  listDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentSchema,
  updateDocumentSchema,
} from '../controllers/document.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireDocumentRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// All document routes require authentication
router.use(authenticateJwt);

router.get('/', listDocuments);
router.post('/', validateRequest(createDocumentSchema), createDocument);

router.get('/:id', requireDocumentRole('VIEWER'), getDocumentById);
router.patch('/:id', requireDocumentRole('EDITOR'), validateRequest(updateDocumentSchema), updateDocument);
router.delete('/:id', requireDocumentRole('OWNER'), deleteDocument);

export default router;
