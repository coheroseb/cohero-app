'use server';
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

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    console.error("Text-to-speech service is currently disabled due to server dependency issues.");
    throw new Error("Text-to-speech service is currently disabled. The 'wav' package is not compatible with the current server environment.");
}
