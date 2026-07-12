import ContactInquiry from './contact.model.js';

const create = (data) => ContactInquiry.create(data);

const findAll = ({ status } = {}) => {
  const filter = status ? { status } : {};
  return ContactInquiry.find(filter)
    .populate('handledBy', 'name email')
    .sort({ createdAt: -1 });
};

const findById = (id) => ContactInquiry.findById(id).populate('handledBy', 'name email');

const update = (id, data) =>
  ContactInquiry.findByIdAndUpdate(id, data, { new: true }).populate('handledBy', 'name email');

export const contactRepository = { create, findAll, findById, update };
