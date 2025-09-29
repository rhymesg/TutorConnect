/**
 * Email service for TutorConnect using SMTP
 * 
 * IMPORTANT: Chat URL Format
 * ========================
 * TutorConnect uses query parameters for chat navigation, NOT dynamic routes.
 * 
 * ✅ Correct: /chat?id={chatId}
 * ❌ Wrong: /chat/{chatId}
 * 
 * This is because the chat page (/app/chat/page.tsx) reads the chat ID from 
 * searchParams and then displays the appropriate chat in the sidebar/main view.
 * 
 * Example URLs:
 * - View specific chat: /chat?id=cmfffizt000012454x0gq1ecz
 * - Chat list page: /chat
 */
import nodemailer from 'nodemailer';
import { getSubjectLabel } from '@/constants/subjects';
import { formatOsloDate, formatOsloTime } from '@/lib/datetime';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface BaseEmailContent {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  additionalInfo?: string;
}

interface BaseEmailTemplate {
  greeting: string;
  mainContent: string;
  footerText?: string;
  settingsUrl?: string;
}

/**
 * Base email configuration
 */
const EMAIL_CONFIG = {
  fromAddress: process.env.EMAIL_FROM || 'noreply@tutorconnect.no',
  fromName: 'TutorConnect',
  baseUrl: process.env.NEXTAUTH_URL,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
} as const;

/**
 * Create base email template with shared header and footer
 */
function createBaseEmailTemplate(templateData: BaseEmailTemplate): EmailTemplate {
  const { greeting, mainContent, footerText, settingsUrl } = templateData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>TutorConnect</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
      <!-- Header -->
      <div style="background: white; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h1 style="margin: 0; color: #0f172a; font-size: 28px; font-weight: bold; letter-spacing: -0.02em;">TutorConnect</h1>
      </div>
      
      <!-- Content -->
      <div style="background-color: white; padding: 40px 32px;">
        ${greeting}
        
        ${mainContent}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 40px 48px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Dette er en automatisk varslings-e-post${settingsUrl ? `. Du kan <a href="${settingsUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">endre dine varselsinnstillinger her</a>` : ''}.
        </p>
        
        ${footerText ? `
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          ${footerText}
        </p>
        ` : ''}
        
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Med vennlig hilsen,<br>
          <strong style="color: #334155;">TutorConnect</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
    TutorConnect

    ${greeting.replace(/<[^>]*>/g, '')}
    
    ${mainContent.replace(/<[^>]*>/g, '')}
    
    Dette er en automatisk varslings-e-post${settingsUrl ? `. Du kan endre dine varselsinnstillinger her: ${settingsUrl}` : ''}.
    
    ${footerText ? `${footerText}\n\n` : ''}Med vennlig hilsen,
    TutorConnect
  `;

  return {
    subject: '', // Will be set by specific email functions
    html: html.trim(),
    text: text.trim(),
  };
}

/**
 * Create SMTP transporter
 */
const createTransporter = () => {
  if (!EMAIL_CONFIG.smtpHost) {
    console.warn('SMTP not configured - emails will only be logged');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtpHost,
    port: EMAIL_CONFIG.smtpPort || 587,
    secure: EMAIL_CONFIG.smtpSecure,
    auth: {
      user: EMAIL_CONFIG.smtpUser,
      pass: EMAIL_CONFIG.smtpPass,
    },
  });
};

/**
 * Email verification template
 */
function createVerificationEmailTemplate(name: string, verificationToken: string): EmailTemplate {
  const verificationUrl = `${EMAIL_CONFIG.baseUrl}/auth/verify-email?token=${verificationToken}`;
  
  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${name}! ✨</h2>`;
  
  const mainContent = `
    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border: 1px solid #7dd3fc; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #0369a1; font-weight: 600; font-size: 18px;">
        🎯 Siste steg: Bekreft e-postadressen din
      </p>
      <p style="margin: 12px 0 0 0; color: #0c4a6e; font-size: 15px; line-height: 1.6;">
        Takk for at du registrerte deg på TutorConnect! Bare ett klikk igjen.
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      For å fullføre registreringen din og få tilgang til alle funksjoner på TutorConnect, må du bekrefte at denne e-postadressen tilhører deg.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${verificationUrl}" 
         style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: all 0.2s; font-size: 15px;">
        Bekreft e-postadresse
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 14px;">
      Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
    </p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; margin: 16px 0;">${verificationUrl}</p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        ⏰ <strong>Viktig:</strong> Denne lenken utløper om 24 timer. Hvis du ikke ba om denne e-posten, kan du trygt ignorere den.
      </p>
    </div>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });
  
  return {
    subject: 'Bekreft din e-postadresse - TutorConnect',
    html: baseTemplate.html,
    text: baseTemplate.text,
  };
}

/**
 * Password reset email template
 */
function createPasswordResetEmailTemplate(name: string, resetToken: string): EmailTemplate {
  const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}`;
  
  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${name}! 🔐</h2>`;
  
  const mainContent = `
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #dc2626; font-weight: 600; font-size: 18px;">
        🔑 Tilbakestilling av passord forespurt
      </p>
      <p style="margin: 12px 0 0 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
        Du har bedt om å tilbakestille passordet ditt for TutorConnect-kontoen din.
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Klikk på knappen nedenfor for å opprette et nytt passord. Denne lenken utløper om 1 time av sikkerhetsgrunner.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${resetUrl}" 
         style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); transition: all 0.2s; font-size: 15px;">
        Tilbakestill passord
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 14px;">
      Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
    </p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; margin: 16px 0;">${resetUrl}</p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f59e0b;">
      <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        <strong>⚠️ Sikkerhetsinformasjon</strong>
      </p>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        • Denne lenken utløper om 1 time<br>
        • Hvis du ikke ba om denne tilbakestillingen, kan du ignorere denne e-posten<br>
        • Passordet ditt endres ikke før du klikker på lenken og oppretter et nytt passord
      </p>
    </div>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });
  
  return {
    subject: 'Tilbakestill passordet ditt',
    html: baseTemplate.html,
    text: baseTemplate.text,
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
  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Velkommen, ${name}! 🎉</h2>`;
  
  const mainContent = `
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 18px;">
        🌟 Gratulerer med å bli medlem av TutorConnect!
      </p>
      <p style="margin: 12px 0 0 0; color: #047857; font-size: 15px; line-height: 1.6;">
        Norges førende plattform for å koble sammen lærere og studenter.
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Du er nå klar til å begynne din læringsreise! Her er hva du kan gjøre som neste steg:
    </p>
    
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1;">
      <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">🚀 Kom i gang</h3>
      <ul style="margin: 0; padding: 0; list-style: none;">
        <li style="margin: 0 0 12px 0; color: #475569; line-height: 1.6; font-size: 15px;">
          <strong style="color: #1e293b;">📝 Opprett ditt første innlegg</strong> - Del hva du kan lære bort eller hva du trenger hjelp med
        </li>
        <li style="margin: 0 0 12px 0; color: #475569; line-height: 1.6; font-size: 15px;">
          <strong style="color: #1e293b;">🔍 Utforsk innlegg</strong> - Se hva andre tilbyr eller søker etter
        </li>
        <li style="margin: 0 0 12px 0; color: #475569; line-height: 1.6; font-size: 15px;">
          <strong style="color: #1e293b;">💬 Start samtaler</strong> - Ta kontakt med andre medlemmer
        </li>
        <li style="margin: 0; color: #475569; line-height: 1.6; font-size: 15px;">
          <strong style="color: #1e293b;">👤 Fullfør profilen din</strong> - Legg til mer informasjon for å øke tilliten
        </li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${EMAIL_CONFIG.baseUrl}/posts" 
         style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: all 0.2s; font-size: 15px;">
        Utforsk innlegg
      </a>
      <a href="${EMAIL_CONFIG.baseUrl}/profile" 
         style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s; font-size: 15px;">
        Fullfør profilen
      </a>
    </div>
    
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #93c5fd;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        💡 <strong>Trenger du hjelp?</strong> Ta gjerne kontakt med oss på <a href="mailto:contact@tutorconnect.no" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">contact@tutorconnect.no</a>
      </p>
    </div>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });
  
  const template: EmailTemplate = {
    subject: 'Velkommen til TutorConnect!',
    html: baseTemplate.html,
    text: baseTemplate.text,
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
  postId?: string;
}

function createMessageDigestEmailTemplate(name: string, unreadChats: UnreadChatInfo[], totalUnreadCount: number): EmailTemplate {
  const chatListHtml = unreadChats.map(chat => {
    const lastMessageInfo = chat.lastMessage
      ? `<div style="margin-top: 18px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border: 1px solid #cbd5e1;">
           <p style="margin: 0; color: #0f172a; font-size: 14px; line-height: 1.6;">
             <strong style="color: #1e293b;">${chat.lastMessage.senderName}:</strong> "${chat.lastMessage.content}"
           </p>
         </div>`
      : '';

    const postInfo = chat.postTitle
      ? `<p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">
           📌 Relatert annonse: ${chat.postId
             ? `<a href="${EMAIL_CONFIG.baseUrl}/posts/${chat.postId}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">"${chat.postTitle}" ↗</a>`
             : `"${chat.postTitle}"`
           }
         </p>`
      : '';

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 18px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div>
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600;">${chat.otherUserName}</p>
            ${postInfo}
          </div>
          <span style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
            ${chat.unreadCount} ${chat.unreadCount === 1 ? 'ny melding' : 'nye meldinger'}
          </span>
        </div>
        ${lastMessageInfo}
        <div style="margin-top: 24px; text-align: right;">
          <a href="${EMAIL_CONFIG.baseUrl}/chat?id=${chat.chatId}"
             style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px; font-weight: 600;">
            Svar nå
          </a>
        </div>
      </div>
    `;
  }).join('');

  const chatListSection = chatListHtml || `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; color: #475569; font-size: 15px;">
      Du har ingen uleste meldinger akkurat nå.
    </div>
  `;

  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${name}! 📫</h2>`;

  const mainContent = `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 18px;">
        🔔 Påminnelse: Du har ${totalUnreadCount} ${totalUnreadCount === 1 ? 'ulest melding' : 'uleste meldinger'} på TutorConnect
      </p>
      <p style="margin: 12px 0 0 0; color: #78350f; font-size: 15px; line-height: 1.6;">
        Logg inn for å holde samtalene i gang og svare når det passer deg.
      </p>
    </div>

    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Her er en oversikt over de nyeste meldingene dine:
    </p>

    <div style="margin: 24px 0;">
      ${chatListSection}
    </div>

    <div style="text-align: center; margin: 36px 0;">
      <a href="${EMAIL_CONFIG.baseUrl}/chat"
         style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; font-size: 15px;">
        Åpne innboksen
      </a>
    </div>

    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #86efac;">
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        💡 <strong>Tips:</strong> Et kjapt svar gjør det enklere å avtale neste steg og holder dialogen varm.
      </p>
    </div>
  `;

  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });

  return {
    subject: `Du har ${totalUnreadCount} ${totalUnreadCount === 1 ? 'ny melding' : 'nye meldinger'}`,
    html: baseTemplate.html,
    text: baseTemplate.text,
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
 * New chat notification email template
 */
function createNewChatEmailTemplate(receiverName: string, senderName: string, postTitle?: string, postId?: string): EmailTemplate {
  const chatUrl = `${EMAIL_CONFIG.baseUrl}/chat`;
  const postUrl = postId ? `${EMAIL_CONFIG.baseUrl}/posts/${postId}` : null;

  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${receiverName}! 💬</h2>`;

  const mainContent = `
    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%); border: 1px solid #93c5fd; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #1d4ed8; font-weight: 600; font-size: 18px;">
        🔔 Ny samtale: ${senderName} har tatt kontakt med deg
      </p>
      <p style="margin: 12px 0 0 0; color: #0f172a; font-size: 15px; line-height: 1.6;">
        Logg inn på TutorConnect for å lese meldingen og svare når det passer deg.
      </p>
    </div>

    ${postTitle ? `
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 0 0 8px 0; color: #1e293b; font-weight: 600; font-size: 15px;">
        Samtalen gjelder:
      </p>
      <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
        ${postUrl
          ? `<a href="${postUrl}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">"${postTitle}" ↗</a>`
          : `"${postTitle}"`
        }
      </p>
    </div>
    ` : `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
        Meldingen er sendt uten en tilknyttet annonse. Logg inn for å se hva det gjelder.
      </p>
    </div>
    `}

    <div style="text-align: center; margin: 36px 0;">
      <a href="${chatUrl}"
         style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; font-size: 15px;">
        Åpne samtalen
      </a>
    </div>

    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #86efac;">
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        💡 <strong>Tips:</strong> Rask respons øker sjansen for god dialog og planlagte avtaler. Du kan alltid fortsette samtalen fra innboksen din.
      </p>
    </div>
  `;

  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });

  return {
    subject: `${senderName} har startet en ny samtale med deg`,
    html: baseTemplate.html,
    text: baseTemplate.text,
  };
}

/**
 * Send new chat notification email
 */
export async function sendNewChatEmail(
  receiverEmail: string,
  receiverName: string,
  senderName: string,
  postTitle?: string,
  postId?: string
): Promise<void> {
  const template = createNewChatEmailTemplate(receiverName, senderName, postTitle, postId);
  await sendEmail(receiverEmail, template);
}

/**
 * Appointment completion reminder email template
 */
function createAppointmentCompletionEmailTemplate(
  userName: string, 
  otherUserName: string, 
  appointmentDateTime: Date,
  duration: number,
  subject: string,
  chatId: string
): EmailTemplate {
  const appointmentUrl = `${EMAIL_CONFIG.baseUrl}/chat/${chatId}/appointments`;
  const formattedDate = formatOsloDate(appointmentDateTime, 'nb-NO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const startTime = formatOsloTime(appointmentDateTime, 'nb-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Calculate end time
  const endDateTime = new Date(appointmentDateTime.getTime() + (duration * 60 * 1000));
  const endTime = formatOsloTime(endDateTime, 'nb-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${userName}! 📅</h2>`;
  
  const mainContent = `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 18px;">
        ⏰ Påminnelse: Vennligst bekreft fullføring av avtalen din
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Din avtale med <strong style="color: #0f172a;">${otherUserName}</strong> var planlagt til:
    </p>
    
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 0; color: #1e293b; font-weight: 500; line-height: 1.6; font-size: 16px;">
        📅 ${formattedDate}<br>
        🕐 ${startTime} - ${endTime} (Fag: ${getSubjectLabel(subject)})
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      <strong style="color: #0f172a;">Den avtalte undervisningstimen har nå blitt avsluttet.</strong> Hvis undervisningen ble gjennomført som planlagt, vennligst bekreft dette ved å klikke på knappen nedenfor.
    </p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #86efac;">
      <p style="margin: 0 0 12px 0; color: #166534; font-size: 15px; line-height: 1.6;">
        <strong>Hvorfor bekrefte fullføring?</strong>
      </p>
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        Når både du og ${otherUserName} bekrefter at undervisningen ble gjennomført, blir dette registrert i din undervisningshistorikk. Basert på antall fullførte timer kan du oppnå <a href="${EMAIL_CONFIG.baseUrl}/badges" style="color: #059669; font-weight: 600;">forskjellige utmerkelser (badges)</a> som vises på profilen din.
      </p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${appointmentUrl}" 
         style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: all 0.2s; font-size: 15px;">
        Bekreft fullføring
      </a>
    </div>
    
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #93c5fd;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        💡 <strong>Tips:</strong> Du vil finne avtalen under "Venter på fullføring" fanen. Hvis undervisningen ikke ble gjennomført, kan du også markere dette.
      </p>
    </div>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });
  
  return {
    subject: `Påminnelse: Bekreft fullføring av avtalen din med ${otherUserName}`,
    html: baseTemplate.html,
    text: baseTemplate.text,
  };
}

/**
 * Send appointment completion reminder email
 */
export async function sendAppointmentCompletionEmail(
  userEmail: string,
  userName: string,
  otherUserName: string,
  appointmentDateTime: Date,
  duration: number,
  subject: string,
  chatId: string
): Promise<void> {
  const template = createAppointmentCompletionEmailTemplate(userName, otherUserName, appointmentDateTime, duration, subject, chatId);
  await sendEmail(userEmail, template);
}

/**
 * Appointment confirmation email template
 */
function createAppointmentConfirmationEmailTemplate(
  userName: string,
  otherUserName: string,
  appointmentDateTime: Date,
  duration: number,
  subject: string,
  location: string,
  chatId: string,
  postTitle?: string,
  postId?: string
): EmailTemplate {
  const appointmentUrl = `${EMAIL_CONFIG.baseUrl}/chat/${chatId}/appointments`;
  const postUrl = postId ? `${EMAIL_CONFIG.baseUrl}/posts/${postId}` : null;
  
  const formattedDate = formatOsloDate(appointmentDateTime, 'nb-NO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const startTime = formatOsloTime(appointmentDateTime, 'nb-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Calculate end time
  const endDateTime = new Date(appointmentDateTime.getTime() + (duration * 60 * 1000));
  const endTime = formatOsloTime(endDateTime, 'nb-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const greeting = `<h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hei ${userName}! 🎉</h2>`;
  
  const mainContent = `
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 18px;">
        ✅ Avtalen din har blitt bekreftet!
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Din avtale med <strong style="color: #0f172a;">${otherUserName}</strong> er nå bekreftet og planlagt til:
    </p>
    
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 0; color: #1e293b; font-weight: 500; line-height: 1.6; font-size: 16px;">
        📅 ${formattedDate}<br>
        🕐 ${startTime} - ${endTime} (Fag: ${getSubjectLabel(subject)})<br>
        📍 ${location}
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.7; margin: 24px 0; font-size: 16px;">
      Du kan se alle detaljer om avtalen og eventuelle meldinger ved å gå til avtaler-siden.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${appointmentUrl}" 
         style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; font-size: 15px;">
        Se avtaledetaljer
      </a>
      ${postUrl ? `<a href="${postUrl}" 
         style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3); transition: all 0.2s; font-size: 15px;">
        📝 Se annonsen
      </a>` : ''}
    </div>
    
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #93c5fd;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        💡 <strong>Tips:</strong> Husk å forberede deg til timen og ta kontakt med ${otherUserName} hvis du har spørsmål.
      </p>
    </div>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    settingsUrl: `${EMAIL_CONFIG.baseUrl}/settings`,
    footerText: undefined
  });
  
  return {
    subject: `Avtalen din med ${otherUserName} er bekreftet`,
    html: baseTemplate.html,
    text: baseTemplate.text,
  };
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmationEmail(
  userEmail: string,
  userName: string,
  otherUserName: string,
  appointmentDateTime: Date,
  duration: number,
  subject: string,
  location: string,
  chatId: string,
  postTitle?: string,
  postId?: string
): Promise<void> {
  const template = createAppointmentConfirmationEmailTemplate(userName, otherUserName, appointmentDateTime, duration, subject, location, chatId, postTitle, postId);
  await sendEmail(userEmail, template);
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
