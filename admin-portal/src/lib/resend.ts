import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = new Resend(resendApiKey || 're_placeholder');

export const isResendConfigured = !!resendApiKey && resendApiKey !== 're_placeholder';
