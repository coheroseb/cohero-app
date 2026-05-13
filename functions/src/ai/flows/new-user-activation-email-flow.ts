// @ts-nocheck

/**
 * @fileOverview AI flow to generate a personalized activation email for
 * new Kollega (free) users who have signed up but haven't used the platform yet.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

const NewUserActivationEmailInputSchema = z.object({
  userName: z.string(),
  profession: z.string().describe("The user's profession (e.g., Socialrådgiver, Pædagog)"),
  daysSinceSignup: z.number().describe("How many days since the user created their account"),
  isWave2: z.boolean().describe("True if this is the second nudge wave (14+ days since signup)"),
});

const NewUserActivationEmailOutputSchema = z.object({
  data: z.object({
    subject: z.string().describe("Fængende emnefelt til e-mailen"),
    content: z.string().describe("Selve e-mail teksten i markdown/HTML-friendly format"),
  }),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});

export type NewUserActivationEmailInput = z.infer<typeof NewUserActivationEmailInputSchema>;

const prompt = ai.definePrompt({
  name: 'newUserActivationEmailPrompt',
  input: { schema: NewUserActivationEmailInputSchema },
  prompt: `Du er Sebastian fra Cohéro og skriver en personlig aktiverings-mail til {{userName}}.

**Kontekst:**
- Brugeren er {{profession}}-studerende.
- De oprettede en gratis Kollega-konto for {{daysSinceSignup}} dage siden.
- De har endnu ikke brugt platformen.
{{#if isWave2}}
- Dette er et ANDET forsøg. Vær lidt mere insisterende og konkret. Fremhæv hvad de går glip af.
{{else}}
- Dette er det FØRSTE forsøg. Vær nysgerrig og venlig — ikke salgsmæssig.
{{/if}}

**Formål:** Få dem til at prøve Cohéro for første gang ved at logge ind på https://cohero.dk/portal.

**Din opgave:**

{{#if isWave2}}
Skriv en ærlig, lidt mere direkte mail. Anerkend at du ved, de ikke er kommet i gang endnu.
Nævn 2-3 konkrete gratis funktioner de kan prøve NU:
- For en "Pædagog": Begrebsguiden (pædagogisk teori), Lov-portalen (Dagtilbudsloven), Case-trainer
- For en "Socialrådgiver": Begrebsguiden (socialfaglige begreber), Lov-portalen (Serviceloven), Case-trainer

Lav en klar opfordring: "Prøv bare ét af disse i dag — det tager under 5 minutter."
{{else}}
Skriv en varm, uformel velkomst-mail. Du er nysgerrig på hvem de er og hvad studiet handler om for dem.
Nævn kort at Cohéro er bygget til netop dem som {{profession}}-studerende.
Løft gardinet for én konkret funktion:
- For en "Pædagog": Begrebsguiden eller Lov-portalen med Dagtilbudsloven
- For en "Socialrådgiver": Begrebsguiden eller Lov-portalen med Serviceloven
Slut af med "Håber vi ses derinde 🙌".
{{/if}}

**Tonefall:** Kollega-til-kollega. Ægte. Ikke corporate. Skriv på dansk.
Max 150-180 ord i selve teksten.

Returner JSON med 'subject' og 'content'.
`,
});

export const newUserActivationEmailFlow = ai.defineFlow(
  {
    name: 'newUserActivationEmailFlow',
    inputSchema: NewUserActivationEmailInputSchema,
    outputSchema: NewUserActivationEmailOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
    };
  }
);
