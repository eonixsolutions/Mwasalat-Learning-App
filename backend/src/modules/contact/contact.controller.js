import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { contactService } from './contact.service.js';

const submit = asyncHandler(async (req, res) => {
  const { name, contact, message } = req.body;
  const inquiry = await contactService.submit({ name, contact, message });
  successResponse(res, 'Message received! We\'ll get back to you shortly.', inquiry, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const inquiries = await contactService.getAll({ status });
  successResponse(res, 'Inquiries fetched', inquiries);
});

const getById = asyncHandler(async (req, res) => {
  const inquiry = await contactService.getById(req.params.id);
  successResponse(res, 'Inquiry fetched', inquiry);
});

const close = asyncHandler(async (req, res) => {
  const inquiry = await contactService.close(req.params.id, req.user._id);
  successResponse(res, 'Inquiry marked as closed', inquiry);
});

export const contactController = { submit, getAll, getById, close };
