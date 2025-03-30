import mongoose from 'mongoose';

// Define the appointment schema
const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: "50 min"
  },
  type: {
    type: String,
    enum: ['video', 'in-person'],
    default: 'video'
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed', 'rescheduled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Appointment model or use existing
export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema); 