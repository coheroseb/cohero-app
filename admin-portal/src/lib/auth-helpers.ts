'use client';

import { Auth, User, sendEmailVerification } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export async function sendVerificationEmail(auth: Auth, user: User) {
    if (!user.email) {
        console.error("User does not have an email to verify.");
        return;
    }

    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/portal`, // Redirect back to portal after verification
            handleCodeInApp: true,
        };

        // Use the standard Firebase email sender
        await sendEmailVerification(user, actionCodeSettings);
        
        toast({
            title: "Bekræftelses-e-mail sendt",
            description: "Vi har sendt et link til din indbakke. Tjek evt. din spam-mappe.",
        });

    } catch (error) {
        console.error("Error sending verification email:", error);
        toast({
            variant: "destructive",
            title: "Fejl",
            description: "Kunne ikke sende bekræftelses-e-mail. Prøv venligst igen.",
        });
    }
}
