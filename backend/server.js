const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const EMAIL_USER = (process.env.EMAIL_USER || "").trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const EMAIL_TO = (process.env.EMAIL_TO || EMAIL_USER).trim();

const SMTP_HOST = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.trim().toLowerCase() === "true"
    : SMTP_PORT === 465;

const emailConfigured = Boolean(EMAIL_USER && EMAIL_PASS && EMAIL_TO);

const transporter = emailConfigured
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        requireTLS: !SMTP_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    })
    : null;

function maskEmail(address) {
    const [localPart, domain] = String(address).split("@");

    if (!localPart || !domain) {
        return "***";
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getEmailErrorMessage(error) {
    if (error.code === "EAUTH" || error.responseCode === 535) {
        return "Gmail rejected the email credentials (535 5.7.8 Username and Password not accepted). Likely causes: EMAIL_PASS is not a valid Gmail App Password, the App Password was revoked, 2-Step Verification is disabled on the Google account, or EMAIL_USER does not match the account that owns the App Password. Generate a new App Password at https://myaccount.google.com/apppasswords, update EMAIL_PASS in backend/.env, and restart the server.";
    }

    if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS"].includes(error.code)) {
        return "Could not connect to the Gmail email server. Please check the server's internet connection and try again.";
    }

    if (error.code === "EENVELOPE") {
        return "The email sender or recipient address is invalid. Please check EMAIL_USER and EMAIL_TO in backend/.env.";
    }

    return "Your application could not be submitted because the confirmation email failed to send. Please try again in a moment.";
}

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.send("Job Vacancy Backend is Running!");
});

app.post("/api/apply", async (req, res) => {
    const body = req.body || {};
    const name =
        typeof body.name === "string" ? body.name.trim() : "";


    const mobile =
        typeof body.mobile === "string"
            ? body.mobile.trim()
            : String(body.mobile ?? "").trim();

    if (!name) {
        return res.status(400).json({
            message: "Please enter your full name.",
            field: "name",
        });
    }

    if (!mobile) {
        return res.status(400).json({
            message: "Please enter your mobile number.",
            field: "mobile",
        });
    }

    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({
            message: "Please enter a valid 10-digit mobile number.",
            field: "mobile",
        });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({
            message: "Mobile number must start with 6, 7, 8, or 9.",
            field: "mobile",
        });
    }

    if (!transporter) {
        console.error(
            "Email is not configured. Set EMAIL_USER, EMAIL_PASS, and EMAIL_TO in backend/.env"
        );

        return res.status(500).json({
            message: "Email service is not configured. Your application was not submitted. Please contact the site administrator.",
        });
    }

    const appliedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });

    const safeName = escapeHtml(name);
    const safeMobile = escapeHtml(mobile);
    const subjectName = name.replace(/[\r\n]+/g, " ");

    try {
        const info = await transporter.sendMail({
            from: `"Job Application" <${EMAIL_USER}>`,
            to: EMAIL_TO,
            subject: `New Job Application: ${subjectName} (${mobile})`,
            text: [
                "New job application received.",
                "",
                `Name: ${name}`,
                `Mobile: ${mobile}`,
                `Received: ${appliedAt}`,
            ].join("\n"),
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="margin: 0 0 12px;">New Job Application</h2>
                    <p style="margin: 0 0 8px;"><strong>Name:</strong> ${safeName}</p>
                    <p style="margin: 0 0 8px;"><strong>Mobile:</strong> ${safeMobile}</p>
                    <p style="margin: 16px 0 0; color: #666;"><strong>Received:</strong> ${escapeHtml(appliedAt)}</p>
                </div>
            `,
        });

        console.log("Application email sent successfully.");
        console.log("Message ID:", info.messageId);
        console.log("SMTP response:", info.response);

        return res.status(200).json({
            message: "Application submitted successfully!",
            applicant: { name, mobile },
        });
    } catch (error) {
        console.error("Failed to send application email.");
        console.error("Code:", error.code || "UNKNOWN");
        console.error("Response code:", error.responseCode || "N/A");
        console.error("Message:", error.message);

        return res.status(500).json({
            message: getEmailErrorMessage(error),
        });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            message: "Invalid JSON data. Please check the form and try again.",
        });
    }

    console.error("Unexpected server error:", err);
    return res.status(500).json({
        message: "Something went wrong on the server. Please try again.",
    });
});

app.listen(PORT, async () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`SMTP config: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_SECURE} user=${maskEmail(EMAIL_USER)} to=${maskEmail(EMAIL_TO)}`);

    if (!transporter) {
        console.error(
            "WARNING: Email is not configured. Set EMAIL_USER, EMAIL_PASS, and EMAIL_TO in backend/.env."
        );
        return;
    }

    try {
        await transporter.verify();
        console.log(`SMTP connection verified (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE}). Email sending is ready for ${maskEmail(EMAIL_USER)} -> ${maskEmail(EMAIL_TO)}.`);
    } catch (error) {
        console.error(
            "WARNING: Gmail SMTP verification failed:",
            error.code || "",
            error.responseCode || "",
            error.message
        );
        console.error(
            "Check: 1) Use a Gmail App Password (not your normal password), 2) Enable 2-Step Verification, 3) Update EMAIL_USER/EMAIL_PASS/EMAIL_TO in backend/.env, 4) Ensure less secure access is not blocking if using legacy methods. App Passwords page: https://myaccount.google.com/apppasswords"
        );
    }
});