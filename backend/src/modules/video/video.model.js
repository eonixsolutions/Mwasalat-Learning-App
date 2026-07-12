import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const videoSchema = new Schema(
  {
    course:      { type: Types.ObjectId, ref: 'Course', required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    week:        { type: Number, required: true, min: 1 },
    // 0 = week-level intro, 1-6 = Monday–Saturday
    day:         { type: Number, default: 0, min: 0, max: 6 },
    shareLink:   { type: String, trim: true, default: '' },  // original SharePoint link pasted by admin
    driveId:     { type: String, trim: true, default: '' },  // resolved via Graph API
    driveItemId: { type: String, trim: true, default: '' },  // resolved via Graph API
    embedUrl:    { type: String, trim: true, default: '' },  // generated via Graph API preview
    duration:    { type: String, trim: true, default: '' }, // display string e.g. "45:30"
    order:       { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    createdBy:   { type: Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

videoSchema.index({ course: 1, week: 1, day: 1, order: 1 });
videoSchema.index({ isPublished: 1 });

const Video = mongoose.model('Video', videoSchema);
export default Video;
