import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'therapist'],
    default: 'user',
  },
  specialization: {
    type: String,
    required: function(this: any) { 
      return this.role === 'therapist'; 
    },
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    default: '/placeholder-user.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered, isModified("password"):', this.isModified('password'));
  
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password...');
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully, new hash length:', this.password.length);
    next();
  } catch (error: any) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
  try {
    console.log(`Comparing passwords - entered length: ${enteredPassword.length}`);
    console.log(`Stored password hash length: ${this.password.length}`);
    
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log(`bcrypt.compare result: ${result}`);
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Export the model
export const User = mongoose.models.User || mongoose.model('User', userSchema);

export type UserType = {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'therapist';
  specialization?: string;
  bio?: string;
  contactEmail?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt?: Date;
}; 