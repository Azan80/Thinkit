import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  value: {
    type: Number,
    required: true,
    enum: [-1, 1], // -1 for downvote, 1 for upvote
  },
}, {
  timestamps: true,
});

// Create compound unique index to prevent multiple votes from same user on same post
voteSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model('Vote', voteSchema); 