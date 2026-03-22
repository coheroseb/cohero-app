
/**
 * @fileOverview An AI flow to convert text to speech. This flow is currently disabled due to server-side dependency issues.
 * - textToSpeech - Converts text to a WAV audio data URI.
 */

import { z } from 'zod';
import {
  TextToSpeechInputSchema,
  TextToSpeechOutputSchema,
  type TextToSpeechInput,
  type TextToSpeechOutput
} from './types';

import { generateElevenLabsTTS } from '@/lib/eleven-labs';

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        const audioDataUri = await generateElevenLabsTTS(input.text);
        return { audioDataUri };
    } catch (error) {
        console.error("Error in textToSpeech flow:", error);
        throw error;
    }
}

