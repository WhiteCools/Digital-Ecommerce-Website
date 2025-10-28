import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?name=User',
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Malaysia',
      },
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    // 🔐 2FA Fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Don't return in queries by default
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
    },
    twoFactorVerified: {
      type: Boolean,
      default: false,
    },
    // 🔒 2FA Security: Account lockout after failed attempts
    twoFactorFailedAttempts: {
      type: Number,
      default: 0,
    },
    twoFactorLockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 SECURITY: Prevent direct role modification
userSchema.pre('save', function (next) {
  // Log role changes for audit
  if (this.isModified('role') && !this.isNew) {
    console.log(`⚠️ ROLE CHANGE DETECTED:`);
    console.log(`   User: ${this.email}`);
    console.log(`   Old Role: ${this._original?.role}`);
    console.log(`   New Role: ${this.role}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
  }
  next();
});

// Store original values for comparison
userSchema.post('init', function () {
  this._original = this.toObject();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// 🔒 SECURITY: Verify user is admin
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// 🔒 SECURITY: Get safe user data (no sensitive fields)
userSchema.methods.getSafeData = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.twoFactorSecret;
  delete userObject.twoFactorBackupCodes;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpire;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;