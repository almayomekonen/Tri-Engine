import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface GlobalThis {
  mongooseCache?: MongooseCache;
}

const cached: MongooseCache = (globalThis as GlobalThis).mongooseCache || {
  conn: null,
  promise: null,
};

if (!(globalThis as GlobalThis).mongooseCache) {
  (globalThis as GlobalThis).mongooseCache = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: "methodian",
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Connected to MongoDB");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

import { Schema, model, models } from "mongoose";

interface IQuestionResponse {
  selected: boolean;
  answer: string | null;
  answeredAt?: Date;
}

interface IQuestionCategory {
  [questionId: string]: IQuestionResponse;
}

interface IAIResult {
  engine: "chatgpt" | "gemini" | "perplexity";
  analysis: string;
  score: number;
  generatedAt: Date;
  tokensUsed?: number;
}

interface IScoring {
  total: number;
  maxPossible: number;
  breakdown: {
    teamCapability: number;
    problemClarity: number;
    solutionDifferentiation: number;
    tamSamSom: number;
    marketTiming: number;
    competitorAwareness: number;
    businessModel: number;
    porterForces: number;
    swotRisk: number;
    crossValidation: number;
    academicSources: number;
    visualsData: number;
    momTest: number;
  };
  lastUpdated: Date;
}

interface IVenture {
  venture_id: string;
  client_id: string;
  basicInfo: {
    businessName: string;
    email: string;
    phone?: string;
    city?: string;
  };
  questionnaire: {
    A_founders_team: IQuestionCategory;
    B_idea_users: IQuestionCategory;
    C_market_understanding: IQuestionCategory;
    D_competitive_landscape: IQuestionCategory;
    E_business_model: IQuestionCategory;
    F_risk_reality: IQuestionCategory;
    G_user_validation: IQuestionCategory;
  };
  responses: {
    totalSelected: number;
    totalAvailable: number;
    completionPercentage: number;
    lastUpdated: Date;
  };
  aiResults: IAIResult[];
  scoring: IScoring;
  status: "draft" | "submitted" | "analyzed" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const QuestionResponseSchema = new Schema<IQuestionResponse>({
  selected: { type: Boolean, default: false },
  answer: { type: String, default: null },
  answeredAt: { type: Date },
});

const AIResultSchema = new Schema<IAIResult>({
  engine: {
    type: String,
    enum: ["chatgpt", "gemini", "perplexity"],
    required: true,
  },
  analysis: { type: String, required: true },
  score: { type: Number, min: 0, max: 105 },
  generatedAt: { type: Date, default: Date.now },
  tokensUsed: { type: Number },
});

const ScoringSchema = new Schema<IScoring>({
  total: { type: Number, min: 0, max: 105, default: 0 },
  maxPossible: { type: Number, default: 105 },
  breakdown: {
    teamCapability: { type: Number, min: 0, max: 15, default: 0 },
    problemClarity: { type: Number, min: 0, max: 10, default: 0 },
    solutionDifferentiation: { type: Number, min: 0, max: 10, default: 0 },
    tamSamSom: { type: Number, min: 0, max: 10, default: 0 },
    marketTiming: { type: Number, min: 0, max: 10, default: 0 },
    competitorAwareness: { type: Number, min: 0, max: 10, default: 0 },
    businessModel: { type: Number, min: 0, max: 10, default: 0 },
    porterForces: { type: Number, min: 0, max: 5, default: 0 },
    swotRisk: { type: Number, min: 0, max: 5, default: 0 },
    crossValidation: { type: Number, min: 0, max: 5, default: 0 },
    academicSources: { type: Number, min: 0, max: 5, default: 0 },
    visualsData: { type: Number, min: 0, max: 5, default: 0 },
    momTest: { type: Number, min: 0, max: 5, default: 0 },
  },
  lastUpdated: { type: Date, default: Date.now },
});

const VentureSchema = new Schema<IVenture>(
  {
    venture_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `VEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    client_id: { type: String, required: true },
    basicInfo: {
      businessName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      city: { type: String },
    },
    questionnaire: {
      A_founders_team: { type: Map, of: QuestionResponseSchema, default: {} },
      B_idea_users: { type: Map, of: QuestionResponseSchema, default: {} },
      C_market_understanding: {
        type: Map,
        of: QuestionResponseSchema,
        default: {},
      },
      D_competitive_landscape: {
        type: Map,
        of: QuestionResponseSchema,
        default: {},
      },
      E_business_model: { type: Map, of: QuestionResponseSchema, default: {} },
      F_risk_reality: { type: Map, of: QuestionResponseSchema, default: {} },
      G_user_validation: { type: Map, of: QuestionResponseSchema, default: {} },
    },
    responses: {
      totalSelected: { type: Number, default: 0 },
      totalAvailable: { type: Number, default: 48 },
      completionPercentage: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    aiResults: [AIResultSchema],
    scoring: { type: ScoringSchema, default: {} },
    status: {
      type: String,
      enum: ["draft", "submitted", "analyzed", "completed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VentureSchema.index({ client_id: 1 });
VentureSchema.index({ "basicInfo.email": 1 });
VentureSchema.index({ status: 1 });
VentureSchema.index({ createdAt: -1 });

VentureSchema.virtual("progressPercentage").get(function () {
  return Math.round(
    (this.responses.totalSelected / this.responses.totalAvailable) * 100
  );
});

const Venture = models.Venture || model<IVenture>("Venture", VentureSchema);

export { Venture };
export type { IVenture, IAIResult, IScoring, IQuestionResponse };
