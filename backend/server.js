const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const EMAIL_TO = (process.env.EMAIL_TO || "").trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const EMAIL_FROM =
    (process.env.EMAIL_FROM || "").trim() || "onboarding@resend.dev";

const QUALIFICATIONS = [
    "10th",
    "12th",
    "ITI",
    "Diploma",
    "Any Graduate",
];

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const emailConfigured = Boolean(resend && EMAIL_TO);

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getEmailErrorMessage(error) {
    const message = error && (error.message || error.toString());
    if (message && message.toLowerCase().includes("unauthorized")) {
        return "Email service authentication failed. Please check the Resend API key.";
    }
    if (message && message.toLowerCase().includes("rate")) {
        return "Email service rate limit exceeded. Please try again later.";
    }
    return "The application email could not be sent. Please try again.";
}

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.send("Job Vacancy Backend is Running!");
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Job Vacancy Backend" });
});

app.post("/api/apply", async (req, res) => {
    const body = req.body || {};

    const name =
        typeof body.name === "string" ? body.name.trim() : "";

    const mobile =
        typeof body.mobile === "string"
            ? body.mobile.trim()
            : String(body.mobile ?? "").trim();

    const qualification =
        typeof body.qualification === "string"
            ? body.qualification.trim()
            : "";

    if (!name) {
        return res.status(400).json({
            message: "Please enter your full name.",
            field: "name",
        });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({
            message: "Please enter a valid 10-digit mobile number.",
            field: "mobile",
        });
    }

    if (!QUALIFICATIONS.includes(qualification)) {
        return res.status(400).json({
            message: "Please select a valid qualification.",
            field: "qualification",
        });
    }

    if (!emailConfigured) {
        console.error("Email service is not configured. Check RESEND_API_KEY and EMAIL_TO.");
        return res.status(500).json({
            message: "Email service is not configured.",
        });
    }

    const appliedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });

    const safeName = escapeHtml(name);
    const safeMobile = escapeHtml(mobile);
    const safeQualification = escapeHtml(qualification);

    try {
        const { error } = await resend.emails.send({
            from: `Job Application <${EMAIL_FROM}>`,
            to: EMAIL_TO,
            subject: `New Job Application: ${name.replace(/[\r\n]+/g, " ")} (${mobile})`,
            text: [
                "New job application received.",
                "",
                `Name: ${name}`,
                `Mobile: ${mobile}`,
                `Qualification: ${qualification}`,
                `Received: ${appliedAt}`,
            ].join("\n"),
            html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Job Application</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Mobile:</strong> ${safeMobile}</p>
          <p><strong>Qualification:</strong> ${safeQualification}</p>
          <p><strong>Received:</strong> ${escapeHtml(appliedAt)}</p>
        </div>
      `,
        });

        if (error) {
            console.error("Email sending failed:", error.name || "RESEND_ERROR");
            return res.status(500).json({
                message: getEmailErrorMessage(error),
            });
        }

        return res.status(200).json({
            message: "Application submitted successfully!",
            applicant: { name, mobile, qualification },
        });
    } catch (error) {
        console.error("Email sending failed:", error.name || "UNKNOWN");
        return res.status(500).json({
            message: getEmailErrorMessage(error),
        });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            message: "Invalid JSON data.",
        });
    }

    console.error("Unexpected server error:", err);

    return res.status(500).json({
        message: "Something went wrong on the server.",
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
        if (!emailConfigured) {
            console.error("Email is not configured. Set RESEND_API_KEY and EMAIL_TO on Render.");
            return;
        }
        console.log("Email service (Resend) configured.");
    });
}

module.exports = app;
