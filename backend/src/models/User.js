import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      default: ''
    },
    username: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined without violating unique constraint
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      select: false // Excluded from default query selections
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBot: {
      type: Boolean,
      default: false
    },
    languageCode: {
      type: String,
      default: 'en'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);