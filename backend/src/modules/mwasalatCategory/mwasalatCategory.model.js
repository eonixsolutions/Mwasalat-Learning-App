import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
  },
  { _id: false }
);

const mwasalatCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    nameAr: { type: String, trim: true },
    description: { type: String, trim: true },
    descriptionAr: { type: String, trim: true },
    subCategories: { type: [subCategorySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mwasalatCategorySchema.index({ isActive: 1 });

const MwasalatCategory = mongoose.model('MwasalatCategory', mwasalatCategorySchema);
export default MwasalatCategory;
