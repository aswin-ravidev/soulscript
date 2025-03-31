import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  }
}, { _id: false });

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
    enum: ['user', 'therapist', 'patient'],
    default: 'user',
  },
  specialization: {
    type: String,
    required: function(this: any) { 
      return this.role === 'therapist'; 
    },
    validate: {
      validator: function(this: any, v: string) {
        // Only validate if the user is a therapist
        if (this.role !== 'therapist') return true;
        // Ensure specialization is not empty and has at least 2 characters
        return v && v.trim().length >= 2;
      },
      message: 'Therapists must provide a valid specialization (at least 2 characters)'
    }
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
  emergencyContacts: {
    type: [emergencyContactSchema],
    default: [],
    validate: {
      validator: function(this: any, contacts: any[]) {
        // Emergency contacts are only required for patients
        if (this.role !== 'patient') return true;
        // If patient, at least one contact should have name and either phone or email
        return contacts.some(contact => 
          contact.name && (contact.phone || contact.email)
        );
      },
      message: 'Patients should have at least one valid emergency contact'
    }
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

export type EmergencyContactType = {
  name: string;
  phone?: string;
  email?: string;
};

export type UserType = {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'therapist' | 'patient';
  specialization?: string;
  bio?: string;
  contactEmail?: string;
  phoneNumber?: string;
  profileImage?: string;
  emergencyContacts?: EmergencyContactType[];
  createdAt?: Date;
}; 