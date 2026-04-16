import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/mongodb";
import {
  UserModel,
  ApplicationModel,
  IUser,
  IApplication,
} from "@/app/lib/models";

// Keep the same interfaces the rest of the codebase expects
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "agent" | "admin";
  createdAt: string;
}

export interface Application {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  passportPhotoFileName?: string;
}

// Helper: convert Mongoose User document → plain User object
function toUser(doc: IUser): User {
  return {
    id: doc._id!.toString(),
    email: doc.email,
    password: doc.password,
    firstName: doc.firstName,
    lastName: doc.lastName,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
  };
}

// Helper: convert Mongoose Application document → plain Application object
function toApplication(doc: IApplication): Application {
  return {
    id: doc._id!.toString(),
    agentId: doc.agentId,
    agentName: doc.agentName,
    agentEmail: doc.agentEmail,
    firstName: doc.firstName,
    lastName: doc.lastName,
    passportNumber: doc.passportNumber,
    idNumber: doc.idNumber,
    nationality: doc.nationality,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    visitPurpose: doc.visitPurpose,
    visitDetail: doc.visitDetail,
    product: doc.product,
    plan: doc.plan,
    period: doc.period,
    days: doc.days,
    startDate: doc.startDate,
    endDate: doc.endDate,
    premium: doc.premium,
    isOver65: doc.isOver65,
    isStudent: doc.isStudent,
    coverageLimit: doc.coverageLimit,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    passportPhotoFileName: doc.passportPhotoFileName,
  };
}

class Database {
  private adminSeeded = false;

  /** Ensure connection + seed admin on first call */
  private async connect() {
    await connectDB();
    if (!this.adminSeeded) {
      // Seed admin@gmail.com
      const existingAdmin = await UserModel.findOne({
        email: "admin@gmail.com",
      });
      if (!existingAdmin) {
        const adminPassword = await bcrypt.hash("admin123", 10);
        await UserModel.create({
          email: "admin@gmail.com",
          password: adminPassword,
          firstName: "Admin",
          lastName: "PRIME",
          role: "admin",
        });
      }
      this.adminSeeded = true;
    }
  }

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User | null> {
    await this.connect();
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) return null;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: "agent",
    });
    return toUser(user);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    await this.connect();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? toUser(user) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    await this.connect();
    const user = await UserModel.findById(id);
    return user ? toUser(user) : null;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async createApplication(
    app: Omit<Application, "id" | "createdAt" | "status">,
  ): Promise<Application> {
    await this.connect();
    const doc = await ApplicationModel.create({
      ...app,
      status: "pending",
    });
    return toApplication(doc);
  }

  async getApplicationsByAgent(agentId: string): Promise<Application[]> {
    await this.connect();
    const docs = await ApplicationModel.find({ agentId }).sort({
      createdAt: -1,
    });
    return docs.map(toApplication);
  }

  async getAllApplications(): Promise<Application[]> {
    await this.connect();
    const docs = await ApplicationModel.find().sort({ createdAt: -1 });
    return docs.map(toApplication);
  }

  async getApplicationById(id: string): Promise<Application | null> {
    await this.connect();
    const doc = await ApplicationModel.findById(id);
    return doc ? toApplication(doc) : null;
  }

  async updateApplicationStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
  ): Promise<Application | null> {
    await this.connect();
    const doc = await ApplicationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return doc ? toApplication(doc) : null;
  }
}

// Singleton
export const db = new Database();
