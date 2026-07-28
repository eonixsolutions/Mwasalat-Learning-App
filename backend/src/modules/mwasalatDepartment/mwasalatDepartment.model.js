import mongoose from 'mongoose';

const mwasalatDepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    nameAr: { type: String, trim: true },
    description: { type: String, trim: true },
    descriptionAr: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mwasalatDepartmentSchema.index({ isActive: 1 });

const MwasalatDepartment = mongoose.model('MwasalatDepartment', mwasalatDepartmentSchema);
export default MwasalatDepartment;
