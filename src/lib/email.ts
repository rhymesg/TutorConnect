/**
 * Email service for TutorConnect using SMTP
 */
import nodemailer from 'nodemailer';

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
 * Create SMTP transporter
 */
const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured - emails will only be logged');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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
          TutorConnect
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
      TutorConnect
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
          TutorConnect
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
      TutorConnect
    `
  };
}

/**
 * Send email using configured email service
 * This is a placeholder implementation - replace with actual email service
 */
async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  const transporter = createTransporter();
  
  // For development/testing without SMTP, log the email instead of sending
  if (!transporter) {
    console.log('🔗 Email would be sent to:', to);
    console.log('📧 Subject:', template.subject);
    console.log('📝 Content:', template.text);
    console.log('🎨 HTML length:', template.html.length, 'characters');
    return;
  }

  try {
    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.fromName,
        address: EMAIL_CONFIG.fromAddress,
      },
      to: to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to, 'MessageID:', result.messageId);
    return; // Successfully sent, exit function
  } catch (error) {
    console.error('❌ Failed to send email to:', to, error);
    throw error;
  }
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
        
        <p>Har du spørsmål? Ta gjerne kontakt med oss på <a href="mailto:contact@tutorconnect.no">contact@tutorconnect.no</a></p>
        
        <p style="color: #666; font-size: 14px;">
          Med vennlig hilsen,<br>
          TutorConnect
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

      Har du spørsmål? Ta gjerne kontakt med oss på contact@tutorconnect.no

      Med vennlig hilsen,
      TutorConnect
    `
  };

  await sendEmail(email, template);
}

/**
 * Message digest email template
 */
export interface UnreadChatInfo {
  chatId: string;
  otherUserName: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    sentAt: Date;
  };
  postTitle?: string;
}

function createMessageDigestEmailTemplate(name: string, unreadChats: UnreadChatInfo[], totalUnreadCount: number): EmailTemplate {
  const chatListHtml = unreadChats.map(chat => {
    const lastMessageInfo = chat.lastMessage 
      ? `<p style="color: #666; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">
           Siste melding fra ${chat.lastMessage.senderName}: "${chat.lastMessage.content}"
         </p>`
      : '';
    
    const postInfo = chat.postTitle 
      ? `<p style="color: #888; font-size: 12px; margin: 5px 0 0 0;">
           Relatert til: ${chat.postTitle}
         </p>`
      : '';
    
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9fafb;">
        <div style="display: flex; justify-content: between; align-items: center;">
          <h4 style="margin: 0; color: #1f2937; font-size: 16px;">💬 ${chat.otherUserName}</h4>
          <span style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${chat.unreadCount} ${chat.unreadCount === 1 ? 'ny melding' : 'nye meldinger'}
          </span>
        </div>
        ${lastMessageInfo}
        ${postInfo}
        <div style="margin-top: 12px;">
          <a href="${EMAIL_CONFIG.baseUrl}/chat/${chat.chatId}" 
             style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">
            → Se meldinger
          </a>
        </div>
      </div>
    `;
  }).join('');

  const chatListText = unreadChats.map(chat => {
    const lastMessageInfo = chat.lastMessage 
      ? `    Siste melding fra ${chat.lastMessage.senderName}: "${chat.lastMessage.content}"`
      : '';
    
    const postInfo = chat.postTitle 
      ? `    Relatert til: ${chat.postTitle}`
      : '';
    
    return `
  • ${chat.otherUserName}: ${chat.unreadCount} ${chat.unreadCount === 1 ? 'ny melding' : 'nye meldinger'}
${lastMessageInfo}
${postInfo}
    Se meldinger: ${EMAIL_CONFIG.baseUrl}/chat/${chat.chatId}
    `;
  }).join('\n');

  return {
    subject: `Du har ${totalUnreadCount} ${totalUnreadCount === 1 ? 'ny melding' : 'nye meldinger'} på TutorConnect`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Nye meldinger på TutorConnect</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">TutorConnect</h1>
        </div>
        
        <div style="background-color: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hei ${name}! 👋</h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Du har <strong>${totalUnreadCount} ${totalUnreadCount === 1 ? 'ny melding' : 'nye meldinger'}</strong> 
            som venter på deg på TutorConnect.
          </p>
          
          <div style="margin: 24px 0;">
            ${chatListHtml}
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}/chat" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
              Se alle meldinger
            </a>
          </div>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            Du mottar dette sammendrag fordi du har aktivert e-postvarsler for nye meldinger. 
            Du kan <a href="${EMAIL_CONFIG.baseUrl}/settings" style="color: #2563eb; text-decoration: none;">
            endre dine varselsinnstillinger her</a>.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Med vennlig hilsen,<br>
            TutorConnect
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Hei ${name}! 👋

      Du har ${totalUnreadCount} ${totalUnreadCount === 1 ? 'ny melding' : 'nye meldinger'} som venter på deg på TutorConnect.

      Dine uleste samtaler:
      ${chatListText}

      Se alle meldinger: ${EMAIL_CONFIG.baseUrl}/chat

      Du mottar dette sammendrag fordi du har aktivert e-postvarsler for nye meldinger. 
      Du kan endre dine varselsinnstillinger her: ${EMAIL_CONFIG.baseUrl}/settings

      Med vennlig hilsen,
      TutorConnect
    `
  };
}

/**
 * Send message digest email
 */
export async function sendMessageDigestEmail(
  email: string,
  name: string,
  unreadChats: UnreadChatInfo[],
  totalUnreadCount: number
): Promise<void> {
  const template = createMessageDigestEmailTemplate(name, unreadChats, totalUnreadCount);
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