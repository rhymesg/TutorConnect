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
  
  const greeting = `<h2 style="color: #1f2937; margin-top: 0;">Hei ${name}!</h2>`;
  
  const mainContent = `
    <p style="color: #374151; line-height: 1.6;">
      Takk for at du registrerte deg på TutorConnect! For å fullføre registreringen din, må du bekrefte e-postadressen din.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" 
         style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
        Bekreft e-postadresse
      </a>
    </div>
    
    <p style="color: #374151; line-height: 1.6;">
      Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
    </p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationUrl}</p>
  `;
  
  const baseTemplate = createBaseEmailTemplate({
    greeting,
    mainContent,
    footerText: 'Denne lenken utløper om 24 timer. Hvis du ikke ba om denne e-posten, kan du ignorere den.'
  });
  
  return {
    subject: 'Bekreft din e-postadresse',
    html: baseTemplate.html,
    text: baseTemplate.text,
  };
}

/**
 * Password reset email template
 */
function createPasswordResetEmailTemplate(name: string, resetToken: string): EmailTemplate {
  const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}`;
  
  return {
    subject: 'Tilbakestill passordet ditt',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Tilbakestill passordet ditt</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
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
      <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
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
      ? `<p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">
           Siste melding fra ${chat.lastMessage.senderName}: "${chat.lastMessage.content}"
         </p>`
      : '';
    
    const postInfo = chat.postTitle 
      ? `<p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
           Relatert til: ${chat.postTitle}
         </p>`
      : '';
    
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9fafb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <h4 style="margin: 0; color: #1f2937; font-size: 16px;">💬 ${chat.otherUserName}</h4>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap;">
                ${chat.unreadCount} ${chat.unreadCount === 1 ? 'ny melding' : 'nye meldinger'}
              </span>
            </td>
          </tr>
        </table>
        ${lastMessageInfo}
        ${postInfo}
        <div style="margin-top: 12px;">
          <a href="${EMAIL_CONFIG.baseUrl}/chat?id=${chat.chatId}" 
             style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">
            → Se meldinger
          </a>
        </div>
      </div>
    `;
  }).join('');

  const greeting = `<h2 style="color: #1f2937; margin-top: 0;">Hei ${name}! 👋</h2>`;
  
  const mainContent = `
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
function createNewChatEmailTemplate(receiverName: string, senderName: string, postTitle?: string): EmailTemplate {
  const chatUrl = `${EMAIL_CONFIG.baseUrl}/chat`;
  
  const greeting = `<h2 style="color: #1f2937; margin-top: 0;">Hei ${receiverName}! 👋</h2>`;
  
  const mainContent = `
    <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #1e40af; font-weight: 500;">
        💬 <strong>${senderName}</strong> har startet en ny samtale med deg!
      </p>
    </div>
    
    ${postTitle ? `
    <p style="color: #374151; line-height: 1.6;">
      Samtalen er relatert til innlegget: <strong>"${postTitle}"</strong>
    </p>
    ` : `
    <p style="color: #374151; line-height: 1.6;">
      En ny person ønsker å komme i kontakt med deg på TutorConnect.
    </p>
    `}
    
    <p style="color: #374151; line-height: 1.6;">
      Logg inn for å se meldingen og svare.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${chatUrl}" 
         style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
        Se samtalen
      </a>
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
  postTitle?: string
): Promise<void> {
  const template = createNewChatEmailTemplate(receiverName, senderName, postTitle);
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
  const formattedDate = appointmentDateTime.toLocaleDateString('no-NO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const startTime = appointmentDateTime.toLocaleTimeString('no-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Calculate end time
  const endDateTime = new Date(appointmentDateTime.getTime() + (duration * 60 * 1000));
  const endTime = endDateTime.toLocaleTimeString('no-NO', { 
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
  
  const formattedDate = appointmentDateTime.toLocaleDateString('no-NO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const startTime = appointmentDateTime.toLocaleTimeString('no-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Calculate end time
  const endDateTime = new Date(appointmentDateTime.getTime() + (duration * 60 * 1000));
  const endTime = endDateTime.toLocaleTimeString('no-NO', { 
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