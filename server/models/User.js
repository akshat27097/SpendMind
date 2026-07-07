import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    monthly_budget: { type: Number, required: true, default: 30000 },
    monthly_income: { type: Number, required: true, default: 60000 },
    currency: { type: String, default: "INR" },
    category_budgets: {
      type: Map,
      of: Number,
      default: {},
    },
    model_trained: { type: Boolean, default: false },
    total_expense_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);