import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 300,
  },
  content: {
    type: String,
    required: true,
    minlength: 1,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  upvotes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ upvotes: -1 });

export default mongoose.models.Post || mongoose.model('Post', postSchema); 