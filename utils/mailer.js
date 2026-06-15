// backend/utils/mailer.js
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────
// Transporter Gmail SMTP
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,      // ton adresse Gmail
        pass: process.env.GMAIL_APP_PASS,  // ton App Password (sans espaces)
    },
});

// ─────────────────────────────────────────
// Envoi de l'email de vérification
// ─────────────────────────────────────────
const sendVerificationEmail = async (toEmail, username, token) => {
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email/${token}`;

    await transporter.sendMail({
        from: `"eSportCal" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: '✅ Confirme ton adresse email — eSportCal',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Bienvenue sur eSportCal, ${username} 👋</h2>
                <p>Clique sur le bouton ci-dessous pour vérifier ton adresse email.</p>
                <p>
                    <a href="${verifyUrl}"
                       style="display:inline-block; padding: 12px 24px; background:#6366f1;
                              color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
                        Vérifier mon email
                    </a>
                </p>
                <p style="color:#888; font-size:13px;">
                    Ce lien expire dans <strong>24 heures</strong>.<br>
                    Si tu n'es pas à l'origine de cette inscription, ignore cet email.
                </p>
                <hr style="border:none; border-top:1px solid #eee;">
                <p style="color:#aaa; font-size:12px;">eSportCal — ton calendrier esport collaboratif</p>
            </div>
        `,
    });
};

module.exports = { sendVerificationEmail };
