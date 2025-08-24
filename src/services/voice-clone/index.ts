// Voice Clone Service - TypeScript Integration Layer
// This module provides a TypeScript interface to the voice cloning functionality

export { synthesize, downloadAudio } from './synthesize';
export type { SynthesizeParams, SynthesizeResult } from './synthesize';

// Re-export for backwards compatibility
export { synthesize as default } from './synthesize';