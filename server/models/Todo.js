const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping', 'health', 'education', 'finance', 'hobby', 'travel'],
    default: 'personal'
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  userId: {  // ADD THIS FIELD
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
TodoSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Todo', TodoSchema);
