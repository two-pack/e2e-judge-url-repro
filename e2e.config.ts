import { existsSync } from 'node:fs';
import type { E2EConfig } from 'e2e';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { openai } from '@ai-sdk/openai';
import { web } from '@e2e-dev/web';
import { gateway } from 'ai';

if (existsSync('.env')) process.loadEnvFile('.env');

const { AI_GATEWAY_API_KEY, MODEL_NAME, MODEL_URL, OPENAI_API_KEY } = process.env;

/** The first of these that is set picks the model; `npm run test:stub` sets MODEL_URL to the stub. */
function model() {
  if (MODEL_URL !== undefined) {
    return createOpenAICompatible({ name: 'local', baseURL: MODEL_URL, supportsStructuredOutputs: true }).chatModel(MODEL_NAME ?? 'local');
  }
  if (AI_GATEWAY_API_KEY !== undefined) return gateway(MODEL_NAME ?? 'openai/gpt-6-luna-fast');
  if (OPENAI_API_KEY !== undefined) return openai(MODEL_NAME ?? 'gpt-6-luna');
  throw new Error('Set MODEL_URL, AI_GATEWAY_API_KEY, or OPENAI_API_KEY in .env, or run npm run test:stub.');
}

export default {
  agents: { default: { model: model() } },
  targets: [
    {
      engine: web(),
      app: { url: 'http://127.0.0.1:4173', command: { executable: 'node', args: [...(MODEL_NAME === 'stub' ? ['--import', './app/stub-model.mjs'] : []), 'app/server.mjs'] } },
    },
  ],
} satisfies E2EConfig;
