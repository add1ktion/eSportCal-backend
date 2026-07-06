// backend/utils/mailer.js
const axios = require('axios');

// ─────────────────────────────────────────
// Envoi via l'API Web HTTPS de Resend (évite le blocage des ports SMTP par Railway)
// ─────────────────────────────────────────
const sendEmailViaResend = async (toEmail, subject, htmlContent) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.warn('⚠️ RESEND_API_KEY is not defined. Email sending skipped.');
        return;
    }

    try {
        await axios.post('https://api.resend.com/emails', {
            from: 'onboarding@resend.dev', // Expéditeur sandbox gratuit de Resend
            to: toEmail,
            subject: subject,
            html: htmlContent
        }, {
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✉️ Email successfully sent via Resend API to ${toEmail}`);
    } catch (error) {
        console.error('❌ Failed to send email via Resend API:', error.response?.data || error.message);
        throw error;
    }
};

// Envoi de l'email de vérification
const sendVerificationEmail = async (toEmail, username, token) => {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost'}/api/auth/verify-email/${token}`;
    const html = `
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
    `;
    await sendEmailViaResend(toEmail, '✅ Confirme ton adresse email — eSportCal', html);
};

// Envoi de l'email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (toEmail, username, token) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost'}/?resetToken=${token}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Reset Your Password, ${username} 🔒</h2>
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <p>
                <a href="${resetUrl}"
                   style="display:inline-block; padding: 12px 24px; background:#6366f1;
                          color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
                    Reset Password
                </a>
            </p>
            <p style="color:#888; font-size:13px;">
                This link will expire in <strong>1 hour</strong>.<br>
                If you did not request a password reset, please ignore this email.
            </p>
            <hr style="border:none; border-top:1px solid #eee;">
            <p style="color:#aaa; font-size:12px;">eSportCal — ton calendrier esport collaboratif</p>
        </div>
    `;
    await sendEmailViaResend(toEmail, '🔒 Reset your password — eSportCal', html);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendEmailViaResend };
