import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import shareRoutes from './share.routes';
import versionRoutes from './version.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/documents/:id/share', shareRoutes);
router.use('/documents/:id/versions', versionRoutes);

export default router;
