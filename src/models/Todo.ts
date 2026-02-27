import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITodo extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
}

const TodoSchema: Schema<ITodo> = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this todo.'],
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Todo: Model<ITodo> = mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);
