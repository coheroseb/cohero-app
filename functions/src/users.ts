import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { scanStudentCard } from "./ai/flows/scan-student-card-flow";
import { Resend } from 'resend';

export const onUserUpdateScanStudentCard = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    if (!after) return null;

    // Check if studentCardUrl changed and is not empty
    const oldUrl = before?.studentCardUrl;
    const newUrl = after?.studentCardUrl;

    // Don't trigger if verification data was just updated (avoid loops)
    const oldVerification = before?.studentCardVerification;
    const newVerification = after?.studentCardVerification;
    
    // Trigger only if URL changed OR if URL exists and verification is missing/pending
    const shouldScan = (newUrl && newUrl !== oldUrl) || (newUrl && !newVerification);

    if (shouldScan) {
        // If the update was just the verification status being written, stop
        if (newUrl === oldUrl && JSON.stringify(oldVerification) !== JSON.stringify(newVerification)) {
            return null;
        }

        console.log(`User ${userId} updated student card. Starting automatic scan...`);
        
        try {
            const userName = after.username || after.email || "Unknown User";
            const scanResult = await scanStudentCard({ 
                imageUrl: newUrl, 
                userFullName: userName 
            });

            const data = scanResult.data;
            const isRejected = !data.isStudentCard || data.isExpired || data.nameMismatch;

            // Update user with verification result
            await admin.firestore().collection("users").doc(userId).update({
                studentCardVerification: {
                    ...data,
                    status: isRejected ? 'rejected' : 'verified',
                    scannedAt: admin.firestore.FieldValue.serverTimestamp()
                },
                // If rejected, also ban from marketplace automatically
                ...(isRejected ? {
                    isMarketplaceBanned: true,
                    marketplaceBanReason: "Automatisk udelukket: Dit studiekort blev afvist under den automatiske scanning (Afventer manuelt tjek af admin)",
                    marketplaceBannedAt: admin.firestore.FieldValue.serverTimestamp()
                } : {})
            });

            if (isRejected) {
                console.log(`Student card for ${userName} REJECTED. Notifying admin...`);
                
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'Cohéro System <system@platform.cohero.dk>',
                    to: 'kontakt@cohero.dk',
                    subject: `⚠️ Afvist Studiekort: ${userName}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px;">
                            <h2 style="color: #991b1b;">Et studiekort blev automatisk afvist</h2>
                            <p><strong>Bruger:</strong> ${userName} (${after.email})</p>
                            <p><strong>Årsag:</strong></p>
                            <ul>
                                <li>Er det et studiekort? ${data.isStudentCard ? 'Ja' : '<span style="color:red">NEJ</span>'}</li>
                                <li>Udløbet? ${data.isExpired ? '<span style="color:red">JA</span>' : 'Nej'} (Dato: ${data.expiryDate || 'Ukendt'})</li>
                                <li>Navne-mismatch? ${data.nameMismatch ? '<span style="color:red">JA</span>' : 'Nej'} (Navn på kort: ${data.nameOnCard})</li>
                            </ul>
                            <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(1)}%</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                            <p><a href="https://cohero.dk/admin/users" style="display: inline-block; padding: 10px 20px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Gå til adminpanel</a></p>
                        </div>
                    `
                });
            } else {
                console.log(`Student card for ${userName} VERIFIED automatically.`);
            }

        } catch (error) {
            console.error(`Automatic scan failed for user ${userId}:`, error);
        }
    }

    return null;
  });
