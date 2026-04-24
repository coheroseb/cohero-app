
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

export const onShopOrderUpdate = functions.firestore
  .document("shop_orders/{orderId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Trigger only when paymentStatus changes to 'paid'
    if (newData.paymentStatus === 'paid' && oldData.paymentStatus !== 'paid') {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { items, total, customerDetails, shippingDetails } = newData;
      const email = customerDetails?.email || newData.userEmail;

      if (!email) {
        console.warn(`[ShopOrder] No email found for order ${context.params.orderId}`);
        return null;
      }

      const itemsHtml = items.map((item: any) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${item.name}</div>
            <div style="font-size: 12px; color: #64748b;">Antal: ${item.quantity}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #1e293b; font-weight: bold;">
            ${item.price * item.quantity} kr.
          </td>
        </tr>
      `).join('');

      try {
        console.log(`[ShopOrder] Sending confirmation email for order ${context.params.orderId} to ${email}`);
        
        await resend.emails.send({
          from: 'Cohéro Shop <shop@platform.cohero.dk>',
          to: email,
          subject: `Ordrebekræftelse #${context.params.orderId.slice(-6).toUpperCase()}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; line-height: 1.6; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; padding: 12px; background-color: #f0fdf4; border-radius: 16px; margin-bottom: 16px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h1 style="color: #1e293b; font-size: 28px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.02em;">Tak for din bestilling!</h1>
                <p style="color: #64748b; margin: 0; font-size: 16px;">Vi har modtaget din betaling og går i gang med at pakke din ordre med det samme.</p>
              </div>

              <div style="background-color: #f8fafc; border-radius: 24px; padding: 32px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
                <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 20px 0; color: #94a3b8;">Ordredetaljer</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 24px 0 0 0; font-weight: 900; color: #1e293b; font-size: 16px;">Total inkl. forsendelse</td>
                    <td style="padding: 24px 0 0 0; font-weight: 900; color: #1e293b; text-align: right; font-size: 20px;">${total} kr.</td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 32px; padding: 0 8px;">
                <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 12px 0; color: #1e293b;">Hvad sker der nu?</h2>
                <p style="margin: 0; color: #64748b; font-size: 15px;">
                  Vores team pakker dine varer så hurtigt som muligt. <strong>Du modtager en ny mail fra os, så snart din forsendelse er afsendt</strong> med et trackinglink og information om levering.
                </p>
              </div>

              ${shippingDetails ? `
                <div style="border-top: 1px solid #f1f5f9; padding-top: 32px; margin-top: 32px; padding-left: 8px; padding-right: 8px;">
                  <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0; color: #94a3b8;">Leveringsadresse</h2>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                    ${shippingDetails.name}<br/>
                    <span style="color: #64748b; font-weight: 400;">
                      ${shippingDetails.address.line1}${shippingDetails.address.line2 ? `, ${shippingDetails.address.line2}` : ''}<br/>
                      ${shippingDetails.address.postal_code} ${shippingDetails.address.city}<br/>
                      ${shippingDetails.address.country === 'DK' ? 'Danmark' : shippingDetails.address.country}
                    </span>
                  </p>
                </div>
              ` : ''}

              <div style="margin-top: 60px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 40px;">
                <p style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 4px;">Har du spørgsmål til din ordre?</p>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Svar blot på denne mail, eller kontakt os på kontakt@cohero.dk</p>
                
                <div style="margin-top: 32px;">
                  <a href="https://cohero.dk" style="text-decoration: none; color: #1e293b; font-weight: 900; font-size: 14px; letter-spacing: 0.05em;">COHÉRO</a>
                </div>
              </div>
            </div>
          `
        });

        // Log the email success
        await admin.firestore().collection("mail_logs").add({
          orderId: context.params.orderId,
          email,
          type: "order_confirmation",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "success"
        });

      } catch (error: any) {
        console.error(`[ShopOrder] Failed to send confirmation for ${context.params.orderId}:`, error);
        await admin.firestore().collection("mail_logs").add({
          orderId: context.params.orderId,
          email,
          type: "order_confirmation",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "error",
          error: error.message
        });
      }
    }

    return null;
  });
