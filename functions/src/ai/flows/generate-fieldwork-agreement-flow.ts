// @ts-nocheck

/**
 * @fileOverview An AI flow to generate a formal fieldwork agreement email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FieldworkAgreementInputSchema = z.object({
  groupName: z.string(),
  projectDescription: z.string(),
  contactName: z.string(),
  contactOrganization: z.string().optional(),
  senderName: z.string(),
});

const FieldworkAgreementOutputSchema = z.object({
  subject: z.string().describe("Professional subject line for the email."),
  body: z.string().describe("The full body text of the fieldwork agreement, formatted professionally with placeholders for date/time if needed."),
});

export async function generateFieldworkAgreement(input: z.infer<typeof FieldworkAgreementInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    output: { schema: FieldworkAgreementOutputSchema },
    system: "Du er en professionel akademisk koordinator. Din opgave er at skrive en høflig, formel og tillidvækkende anmodning om feltarbejde/interview på vegne af en studiegruppe af socialrådgiverstuderende. Svar på dansk.",
    prompt: `Skriv en formel feltarbejdsaftale til følgende modtager:
    
    Modtager: ${input.contactName} ${input.contactOrganization ? `fra ${input.contactOrganization}` : ''}
    Fra Studiegruppe: ${input.groupName} (repræsenteret af ${input.senderName})
    Projektbeskrivelse: ${input.projectDescription}
    
    Aftalen skal indeholde:
    1. En klar præsentation af de studerende og deres uddannelse.
    2. Formålet med projektet.
    3. Hvad det kræver af modtageren (f.eks. et interview på 45-60 min).
    4. Information om anonymisering og GDPR (at data behandles fortroligt).
    5. Tak for hjælpen.
    
    Gør det let for modtageren at sige ja ved at være yderst professionel og tydelig om tidsforbruget.`,
  });

  return output!;
}
