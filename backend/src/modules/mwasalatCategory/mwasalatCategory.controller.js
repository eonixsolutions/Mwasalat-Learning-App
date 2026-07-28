import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatCategoryService } from './mwasalatCategory.service.js';

const list = asyncHandler(async (req, res) => {
  const categories = await mwasalatCategoryService.list();
  successResponse(res, 'Categories fetched', categories);
});

const listActive = asyncHandler(async (req, res) => {
  const categories = await mwasalatCategoryService.listActive();
  successResponse(res, 'Categories fetched', categories);
});

const create = asyncHandler(async (req, res) => {
  const category = await mwasalatCategoryService.create(req.body, req.mwasalatUser);
  successResponse(res, 'Category created', category, 201);
});

const update = asyncHandler(async (req, res) => {
  const category = await mwasalatCategoryService.update(req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Category updated', category);
});

const remove = asyncHandler(async (req, res) => {
  const category = await mwasalatCategoryService.remove(req.params.id, req.mwasalatUser);
  successResponse(res, 'Category deleted', category);
});

const suggest = asyncHandler(async (req, res) => {
  const suggestion = await mwasalatCategoryService.suggest(req.body.name);
  successResponse(res, 'Suggestion generated', suggestion);
});

export const mwasalatCategoryController = { list, listActive, create, update, remove, suggest };
