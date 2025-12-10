const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { PDFDocument } = require("pdf-lib");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); 
const PDF_DIRECTORY = path.join(__dirname, "pdfs");
const SIGNED_DIRECTORY = path.join(__dirname, "signed");
fs.mkdir(SIGNED_DIRECTORY, { recursive: true }).catch(() => {});

fs.mkdir(SIGNED_DIRECTORY, { recursive: true }).catch(() => {});
const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  console.error("Error!!! MONGODB_URI is not set in .env");
} else {
  mongoose
    .connect(mongodbUri)
    .then(() => console.log("Good...MongoDB connected"))
    .catch((err) => console.error("Oops!!! MongoDB connection error:", err));
}
const auditLogSchema = new mongoose.Schema(
  {
    pdfId: { type: String, required: true },
    originalHash: { type: String, required: true },
    signedHash: { type: String, required: true },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

app.get("/", (req, res) => {
  res.send("PDF signing backend is running");
});
app.get("/pdf/sample", (req, res) => {
  const pdfPath = path.join(PDF_DIRECTORY, "sample.pdf");
  res.sendFile(pdfPath, (err) => {
    if (err) {
      console.error("Error sending sample.pdf:", err);
      res.status(err.statusCode || 500).end();
    }
  });
});

app.get("/pdf/signed/:fileName", (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(SIGNED_DIRECTORY, fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending signed PDF:", err);
      res.status(err.statusCode || 500).end();
    }
  });
});
app.post("/sign-pdf", async (req, res) => {
  try {
    const { pdfId, signatureImageBase64, box } = req.body;

    if (!pdfId || !signatureImageBase64 || !box) {
      return res.status(400).json({ error: "pdfId, signatureImageBase64 and box are required" });
    }
    if (pdfId !== "sample") {
      return res.status(400).json({ error: "Unsupported pdfId. Use 'sample' for this prototype." });
    }

    const originalPdfPath = path.join(PDF_DIRECTORY, "sample.pdf");

    const originalPdfBytes = await fs.readFile(originalPdfPath);

    const originalHash = sha256Buffer(originalPdfBytes);

    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    const base64Part = signatureImageBase64.split(",")[1] || signatureImageBase64;
const sigBytes = Buffer.from(base64Part, "base64");

let signatureImage;
if (signatureImageBase64.startsWith("data:image/png")) {
  signatureImage = await pdfDoc.embedPng(sigBytes);
} else {
  signatureImage = await pdfDoc.embedJpg(sigBytes);
}

const imgWidth = signatureImage.width;
const imgHeight = signatureImage.height;


    const { page: pageIndex, x, y, width: boxWidth, height: boxHeight } = box;

    const page = pdfDoc.getPage(pageIndex);
    const scale = Math.min(boxWidth / imgWidth, boxHeight / imgHeight);
    const Width = imgWidth * scale;
    const Height = imgHeight * scale;
    const X = x + (boxWidth - Width) / 2;
    const Y = y + (boxHeight - Height) / 2;
    page.drawImage(signatureImage, {
      x: X,
      y: Y,
      width: Width,
      height: Height,
    });
    const signedPdfBytes = await pdfDoc.save();
    const signedHash = sha256Buffer(signedPdfBytes);
    const timestamp = Date.now();
    const signedFileName = `signed-${pdfId}-${timestamp}.pdf`;
    const signedPath = path.join(SIGNED_DIRECTORY, signedFileName);

    await fs.writeFile(signedPath, signedPdfBytes);
    await AuditLog.create({
      pdfId,
      originalHash,
      signedHash,
    });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const signedUrl = `${baseUrl}/pdf/signed/${signedFileName}`;

    res.json({
      message: "PDF signed successfully! Thanks for using our app",
      pdfId,
      signedUrl,
      originalHash,
      signedHash,
    });
  } catch (err) {
    console.error("Oops!! Error in /sign-pdf:", err);
    res.status(500).json({ error: "Sorry! Failed to sign PDF" });
  }
});
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Super! Server running on http://localhost:${PORT}`);
});
