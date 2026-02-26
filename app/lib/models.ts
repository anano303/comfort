import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "agent" | "admin";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ["agent", "admin"], default: "agent" },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// -------------------------------------------------------------------

export interface IApplication extends Document {
  agentId: string;
  agentName: string;
  agentEmail: string;
  // Client info
  firstName: string;
  lastName: string;
  passportNumber: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  visitPurpose: string;
  visitDetail: string;
  // Insurance info
  product: string;
  plan: string;
  period: string;
  days: number;
  startDate: string;
  endDate: string;
  premium: number;
  isOver65: boolean;
  isStudent: boolean;
  coverageLimit: number;
  // Status
  status: "pending" | "approved" | "rejected";
  passportPhotoFileName?: string;
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  agentEmail: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  passportNumber: { type: String, required: true },
  idNumber: { type: String, default: "" },
  nationality: { type: String, default: "" },
  dateOfBirth: { type: String, default: "" },
  gender: { type: String, default: "" },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: "" },
  visitPurpose: { type: String, default: "" },
  visitDetail: { type: String, default: "" },
  product: { type: String, required: true },
  plan: { type: String, default: "" },
  period: { type: String, default: "" },
  days: { type: Number, default: 0 },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  premium: { type: Number, required: true },
  isOver65: { type: Boolean, default: false },
  isStudent: { type: Boolean, default: false },
  coverageLimit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  passportPhotoFileName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const ApplicationModel: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
