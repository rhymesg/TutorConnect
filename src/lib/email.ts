/**
 * Email service for TutorConnect
 * This is a placeholder implementation. In production, you would use:
 * - SendGrid
 * - AWS SES
 * - Postmark
 * - Mailgun
 * - Or similar email service
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base email configuration
 */
const EMAIL_CONFIG = {
  fromAddress: process.env.EMAIL_FROM || 'noreply@tutorconnect.no',
  fromName: 'TutorConnect',
  baseUrl: process.env.NEXTAUTH_URL || 'https://tutorconnect.no',
} as const;

/**
 * Email verification template
 */
function createVerificationEmailTemplate(name: string, verificationToken: string): EmailTemplate {
  const verificationUrl = `${EMAIL_CONFIG.baseUrl}/auth/verify-email?token=${verificationToken}`;
  
  return {
    subject: 'Bekreft din e-postadresse - TutorConnect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bekreft din e-postadresse</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">TutorConnect</h1>
        </div>
        
        <h2>Hei ${name}!</h2>
        
        <p>Takk for at du registrerte deg på TutorConnect! For å fullføre registreringen din, må du bekrefte e-postadressen din.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Bekreft e-postadresse
          </a>
        </div>
        
        <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Denne lenken utløper om 24 timer. Hvis du ikke ba om denne e-posten, kan du ignorere den.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Med vennlig hilsen,<br>
          TutorConnect-teamet
        </p>
      </body>
      </html>
    `,
    text: `
      Hei ${name}!

      Takk for at du registrerte deg på TutorConnect! For å fullføre registreringen din, må du bekrefte e-postadressen din.

      Klikk på denne lenken for å bekrefte: ${verificationUrl}

      Denne lenken utløper om 24 timer. Hvis du ikke ba om denne e-posten, kan du ignorere den.

      Med vennlig hilsen,
      TutorConnect-teamet
    `
  };
}

/**
 * Password reset email template
 */
function createPasswordResetEmailTemplate(name: string, resetToken: string): EmailTemplate {
  const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}`;
  
  return {
    subject: 'Tilbakestill passordet ditt - TutorConnect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Tilbakestill passordet ditt</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">TutorConnect</h1>
        </div>
        
        <h2>Hei ${name}!</h2>
        
        <p>Du har bedt om å tilbakestille passordet ditt for TutorConnect-kontoen din.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Tilbakestill passord
          </a>
        </div>
        
        <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>Sikkerhetsinformasjon:</strong><br>
          • Denne lenken utløper om 1 time<br>
          • Hvis du ikke ba om denne tilbakestillingen, kan du ignorere denne e-posten<br>
          • Passordet ditt endres ikke før du klikker på lenken og oppretter et nytt passord
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Med vennlig hilsen,<br>
          TutorConnect-teamet
        </p>
      </body>
      </html>
    `,
    text: `
      Hei ${name}!

      Du har bedt om å tilbakestille passordet ditt for TutorConnect-kontoen din.

      Klikk på denne lenken for å tilbakestille: ${resetUrl}

      Sikkerhetsinformasjon:
      • Denne lenken utløper om 1 time
      • Hvis du ikke ba om denne tilbakestillingen, kan du ignorere denne e-posten
      • Passordet ditt endres ikke før du klikker på lenken og oppretter et nytt passord

      Med vennlig hilsen,
      TutorConnect-teamet
    `
  };
}

/**
 * Send email using configured email service
 * This is a placeholder implementation - replace with actual email service
 */
async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  // In production, implement actual email sending logic here
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: to,
    from: {
      email: EMAIL_CONFIG.fromAddress,
      name: EMAIL_CONFIG.fromName,
    },
    subject: template.subject,
    text: template.text,
    html: template.html,
  };
  
  await sgMail.send(msg);
  */

  // For development/testing, log the email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Email would be sent to:', to);
    console.log('📧 Subject:', template.subject);
    console.log('📝 Content:', template.text);
    console.log('🎨 HTML length:', template.html.length, 'characters');
    return;
  }

  // In production, throw error if no email service is configured
  console.error('Email service not configured. Email not sent to:', to);
  throw new Error('Email service not configured');
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<void> {
  const template = createVerificationEmailTemplate(name, verificationToken);
  await sendEmail(email, template);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const template = createPasswordResetEmailTemplate(name, resetToken);
  await sendEmail(email, template);
}

/**
 * Send welcome email (optional)
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const template: EmailTemplate = {
    subject: 'Velkommen til TutorConnect!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Velkommen til TutorConnect!</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">TutorConnect</h1>
        </div>
        
        <h2>Velkommen, ${name}! 🎉</h2>
        
        <p>Gratulerer med å bli medlem av TutorConnect - Norges førende plattform for å koble sammen lærere og studenter!</p>
        
        <h3>Hva kan du gjøre nå?</h3>
        <ul>
          <li><strong>Opprett ditt første innlegg</strong> - Del hva du kan lære bort eller hva du trenger hjelp med</li>
          <li><strong>Utforsk innlegg</strong> - Se hva andre tilbyr eller søker etter</li>
          <li><strong>Start samtaler</strong> - Ta kontakt med andre medlemmer</li>
          <li><strong>Fullfør profilen din</strong> - Legg til mer informasjon for å øke tilliten</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.baseUrl}/dashboard" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Gå til dashbordet
          </a>
        </div>
        
        <p>Har du spørsmål? Ta gjerne kontakt med oss på <a href="mailto:support@tutorconnect.no">support@tutorconnect.no</a></p>
        
        <p style="color: #666; font-size: 14px;">
          Med vennlig hilsen,<br>
          TutorConnect-teamet
        </p>
      </body>
      </html>
    `,
    text: `
      Velkommen, ${name}! 🎉

      Gratulerer med å bli medlem av TutorConnect - Norges førende plattform for å koble sammen lærere og studenter!

      Hva kan du gjøre nå?
      • Opprett ditt første innlegg - Del hva du kan lære bort eller hva du trenger hjelp med
      • Utforsk innlegg - Se hva andre tilbyr eller søker etter
      • Start samtaler - Ta kontakt med andre medlemmer
      • Fullfør profilen din - Legg til mer informasjon for å øke tilliten

      Besøk dashbordet ditt: ${EMAIL_CONFIG.baseUrl}/dashboard

      Har du spørsmål? Ta gjerne kontakt med oss på support@tutorconnect.no

      Med vennlig hilsen,
      TutorConnect-teamet
    `
  };

  await sendEmail(email, template);
}

/**
 * Email service health check
 */
export async function testEmailService(): Promise<boolean> {
  try {
    // In production, this would test the actual email service connection
    console.log('Email service check: Configuration loaded');
    return true;
  } catch (error) {
    console.error('Email service check failed:', error);
    return false;
  }
}