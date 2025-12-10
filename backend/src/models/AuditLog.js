import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    pdfId: { type: String, required: true },
    originalHash: { type: String, required: true },
    signedHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
