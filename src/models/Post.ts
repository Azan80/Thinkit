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
  imageUrls: [{
    type: String,
  }],
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
// Compound index for the most common query pattern: tags + sorting by date
postSchema.index({ tags: 1, createdAt: -1 });

// Compound index for user posts sorted by date
postSchema.index({ userId: 1, createdAt: -1 });

// Single field indexes for other common operations
postSchema.index({ createdAt: -1 }); // For global feed sorting
postSchema.index({ upvotes: -1 }); // For potential "top posts" feature

// Add text index for potential future text search
postSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Post || mongoose.model('Post', postSchema); 