/**
 * User model
 * ----------
 * `select: false` on password means it is NEVER returned by queries unless we
 * explicitly ask for it with .select('+password') (only done during login).
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

/** Safe shape to send to the client (no password, `id` instead of `_id`). */
userSchema.methods.toPublic = function toPublic() {
  return { id: this._id.toString(), username: this.username, email: this.email };
};

export const User = mongoose.model('User', userSchema);
