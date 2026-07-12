import { contactRepository } from './contact.repository.js';
import { notifyRole } from '../notification/notification.service.js';
import { ROLES } from '../../constants/index.js';
import { AppError } from '../../utils/AppError.js';

const STAFF_ROLES_TO_NOTIFY = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR];

const submit = async ({ name, contact, message }) => {
  const inquiry = await contactRepository.create({ name, contact, message });

  notifyRole(STAFF_ROLES_TO_NOTIFY, {
    type:    'contact_inquiry',
    title:   'New Contact Inquiry',
    message: `${name} (${contact}): ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
    data:    { inquiryId: inquiry._id, name, contact, message },
  }).catch(() => {});

  return inquiry;
};

const getAll = ({ status } = {}) => contactRepository.findAll({ status });

const getById = async (id) => {
  const inquiry = await contactRepository.findById(id);
  if (!inquiry) throw new AppError('Inquiry not found', 404);
  return inquiry;
};

const close = async (id, userId) => {
  const inquiry = await contactRepository.findById(id);
  if (!inquiry) throw new AppError('Inquiry not found', 404);
  return contactRepository.update(id, {
    status: 'closed',
    handledBy: userId,
    handledAt: new Date(),
  });
};

export const contactService = { submit, getAll, getById, close };
