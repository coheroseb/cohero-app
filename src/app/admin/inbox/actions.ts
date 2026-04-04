'use server';

/**
 * @fileOverview Server actions for the Simply.com IMAP/SMTP integration.
 */

import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// SIMPLY.COM CREDENTIALS (Move these to .env later!)
const EMAIL_USER = 'kontakt@cohero.dk';
const EMAIL_PASS = '#cohero2026';
const IMAP_HOST = 'mail.simply.com';
const SMTP_HOST = 'websmtp.simply.com';

/**
 * Fetch the latest emails from Simply.com via IMAP.
 */
export async function fetchEmails(limit: number = 20) {
  try {
    const config = {
      imap: {
        user: EMAIL_USER,
        password: EMAIL_PASS,
        host: IMAP_HOST,
        port: 993,
        tls: true,
        authTimeout: 3000,
      },
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Sort by date (descending) and limit
    const latestItems = messages
        .slice(-limit)
        .reverse();

    const parsedMails = await Promise.all(
      latestItems.map(async (item) => {
        const all = item.parts.find((part) => part.which === '');
        const id = item.attributes.uid;
        const parsed = await simpleParser(all!.body);
        
        return {
          id: id.toString(),
          from: parsed.from?.text || 'Ukendt Afsender',
          subject: parsed.subject || '(Intet Emne)',
          date: parsed.date || new Date(),
          excerpt: parsed.text?.slice(0, 100) + '...',
          content: parsed.html || parsed.textAsHtml || parsed.text,
          to: parsed.to?.text || EMAIL_USER,
          isUnread: !item.attributes.flags.includes('\\Seen')
        };
      })
    );

    connection.end();
    return parsedMails;
  } catch (error: any) {
    console.error('Failed to fetch IMAP emails:', error);
    return [];
  }
}

/**
 * Send a reply via Simply.com SMTP.
 */
export async function sendEmailReply(to: string, subject: string, content: string) {
    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: EMAIL_USER,
                password: EMAIL_PASS,
            },
        } as any);

        const mailOptions = {
            from: `"Cohéro Support" <${EMAIL_USER}>`,
            to: to,
            subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155;">
                    <p>${content.replace(/\n/g, '<br/>')}</p>
                    <hr style="border: none; border-top: 1px solid #e1e8ed; margin: 30px 0;" />
                    <p style="font-size: 11px; color: #64748b;">
                        Hilsen Team Cohéro<br/>
                        <a href="https://cohero.dk" style="color: #451a03; text-decoration: none; font-weight: bold;">www.cohero.dk</a>
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Failed to send SMTP reply:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete an email via IMAP.
 */
export async function deleteEmail(uid: string) {
    try {
        const config = {
            imap: {
                user: EMAIL_USER,
                password: EMAIL_PASS,
                host: IMAP_HOST,
                port: 993,
                tls: true,
                authTimeout: 3000,
            },
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Flag the message for deletion
        await connection.addFlags(uid, ['\\Deleted']);
        
        // Expunge to permanently remove
        await connection.imap.expunge((err: any) => {
            if (err) console.error('Expunge error:', err);
        });

        connection.end();
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete IMAP email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * AI Inbox Analysis for prioritization.
 */
export async function analyzeInbox(emails: any[]) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        }); 

        const emailSummary = emails.map(e => `FRA: ${e.from}\nEMNE: ${e.subject}\nINDHOLD: ${e.excerpt}`).join('\n---\n');

        const prompt = `
            Du er en strategisk AI-assistent for Cohéro. 
            Her er en liste over de seneste indgående e-mails:
            
            ${emailSummary}

            Din opgave er at give en lynhurtig strategisk analyse af indbakken.
            1. Status: En kort status i ét ord eller kort sætning (f.eks. "Modulering af support påkrævet").
            2. Analyse: En kort opsummering af indholdet.
            3. Prioritering: Liste over 3 vigtigste sager.
            4. Kategorier: Fordeling (Support, Salg, Info).
            5. Råd: Ét konkret råd til Sebastian.

            Returner JSON objekt med keys: status, analysis, priorities (array af string), categories (array af string), advice.
            Skriv alt på dansk.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error: any) {
        console.error('Error analyzing inbox:', error);
        return null;
    }
}

/**
 * Generate a draft reply via AI.
 */
export async function generateReplyDraft(email: any) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `
            Du er en kundesupport-assistent for Cohéro. 
            Skriv et professionelt, hjælpsomt og venligt udkast til et svar på denne e-mail:
            
            FRA: ${email.from}
            EMNE: ${email.subject}
            INDHOLD: ${email.content}

            Retningslinjer:
            1. Svar på dansk.
            2. Hold en venlig og støttende tone (vi er her for de studerende).
            3. Hvis det er et teknisk problem, vær forstående.
            4. Hvis det er en tak eller feedback, vær taknemmelig.
            5. Inkluder de nødvendige detaljer fra mailen.

            Returner KUN selve svars-teksten (uden hilsen til sidst, da systemet tilføjer dette).
            Vær præcis og professionel.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('Error generating AI reply draft:', error);
        return "Kunne ikke generere udkast. Prøv igen manuelt.";
    }
}

/**
 * Get unread email count from Simply.com.
 */
export async function getUnreadCount() {
    try {
        const config = {
            imap: {
                user: EMAIL_USER,
                password: EMAIL_PASS,
                host: IMAP_HOST,
                port: 993,
                tls: true,
                authTimeout: 3000,
            },
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const count = messages.length;

        connection.end();
        return count;
    } catch (error: any) {
        console.error('Failed to get unread IMAP count:', error);
        return 0;
    }
}

/**
 * Mark an email as read (SEEN) via IMAP.
 */
export async function markAsRead(uid: string) {
    try {
        const config = {
            imap: {
                user: EMAIL_USER,
                password: EMAIL_PASS,
                host: IMAP_HOST,
                port: 993,
                tls: true,
                authTimeout: 3000,
            },
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Add SEEN flag
        await connection.addFlags(uid, ['\\Seen']);

        connection.end();
        return { success: true };
    } catch (error: any) {
        console.error('Failed to mark IMAP email as read:', error);
        return { success: false, error: error.message };
    }
}
