import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  text:   { type: String, required: true, trim: true },
  indent: { type: Number, default: 0, min: 0, max: 2 },
}, { _id: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, default: '', trim: true },
  intro: { type: String, default: '', trim: true },
  items: [itemSchema],
}, { _id: true });

const daySchema = new mongoose.Schema({
  dayNumber:    { type: Number, required: true, min: 0 },
  isExtraDay:   { type: Boolean, default: false },
  title:        { type: String, default: '', trim: true },
  objective:    { type: String, default: '', trim: true },
  contentItems: [itemSchema],
  tasks:        [taskSchema],
  finalStep:    { type: String, default: '', trim: true },
}, { _id: true });

const taskSheetContentSchema = new mongoose.Schema({
  course:          { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  program:         { type: String, required: true, trim: true },
  week:            { type: Number, required: true, min: 1 },
  topicsOverview:  { type: String, default: '', trim: true },
  days:            [daySchema],
  isPublished:     { type: Boolean, default: false },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

taskSheetContentSchema.index({ course: 1, week: 1 }, { unique: true });
taskSheetContentSchema.index({ program: 1, isPublished: 1 });

export default mongoose.model('TaskSheetContent', taskSheetContentSchema);
