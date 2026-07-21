import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  listProvinces,
  listMunicipalities,
  searchBarangays,
  listBarangays,
} from './address.controller.js';

const addressRouter = Router();

addressRouter.get('/provinces', asyncHandler(listProvinces));
addressRouter.get('/municipalities', asyncHandler(listMunicipalities));
addressRouter.get('/barangays/search', asyncHandler(searchBarangays));
addressRouter.get('/barangays', asyncHandler(listBarangays));

export default addressRouter;
