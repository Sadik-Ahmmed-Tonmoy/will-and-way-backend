import express from 'express';
import { AssetController } from './asset.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/', auth(), AssetController.createAsset);
router.get('/', auth(), AssetController.getAssets);
router.put('/:id', auth(), AssetController.updateAsset);
router.delete('/:id', auth(), AssetController.deleteAsset);

router.post('/properties', auth(), AssetController.createProperty);
router.get('/properties', auth(), AssetController.getProperties);
router.get('/properties/:id', auth(), AssetController.getPropertyById);
router.put('/properties/:id', auth(), AssetController.updateProperty);
router.delete('/properties/:id', auth(), AssetController.deleteProperty);

router.post('/loans', auth(), AssetController.createLoan);
router.get('/loans', auth(), AssetController.getLoans);
router.get('/loans/:id', auth(), AssetController.getLoanById);
router.put('/loans/:id', auth(), AssetController.updateLoan);
router.delete('/loans/:id', auth(), AssetController.deleteLoan);

export const AssetRoutes = router;