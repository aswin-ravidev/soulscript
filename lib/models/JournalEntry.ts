import mongoose from 'mongoose';

export type MentalHealthClass = 'Anxiety' | 'Bipolar' | 'Depression' | 'Normal' | 'Personality disorder' | 'Stress' | 'Suicidal';

const journalEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  mood: {
    type: String,
    required: true,
  },
  mentalHealthClass: {
    type: String,
    enum: ['Anxiety', 'Bipolar', 'Depression', 'Normal', 'Personality disorder', 'Stress', 'Suicidal'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);

export type JournalEntryType = {
  _id?: string;
  title: string;
  content: string;
  date: Date;
  mood: string;
  mentalHealthClass: MentalHealthClass;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}; 