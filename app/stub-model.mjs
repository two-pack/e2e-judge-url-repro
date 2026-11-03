// An OpenAI-compatible model, so the repro runs without a key. It answers from
// the prompt alone, so it says nothing about how a real model behaves. It only
// shows what the judge is given: every prompt lands in .e2e/stub-prompts.log.
import { appendFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';

const judge = (prompt) => {
  const expected = /URL path is (\/\S*)/.exec(prompt)?.[1];
  const evidence = prompt.replace(/<instruction>[\s\S]*?<\/instruction>/, '');
  const actual = /\/(?:page|moving|moved)\b/.exec(evidence)?.[0];
  if (actual === undefined) return { verdict: 'inconclusive', explanation: 'The observation does not contain the URL path.' };
  return actual === expected
    ? { verdict: 'holds', explanation: `The URL path is ${actual}.` }
    : { verdict: 'fails', explanation: `The URL path is ${actual}, not ${expected}.` };
};

createServer(async (request, response) => {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  const { messages, stream } = JSON.parse(raw);
  const user = messages.findLast((message) => message.role === 'user');
  const prompt = typeof user.content === 'string' ? user.content : user.content.map((part) => part.text ?? '').join('\n');
  mkdirSync('.e2e', { recursive: true });
  appendFileSync('.e2e/stub-prompts.log', `${prompt}\n=====\n`);
  const content = JSON.stringify({ protocolVersion: 'agent-judgment-2', ...judge(prompt) });
  const usage = { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 };
  const base = { id: 'stub', created: 0, model: 'stub' };
  if (stream === true) {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    const send = (event) => response.write(`data: ${JSON.stringify({ ...base, object: 'chat.completion.chunk', ...event })}\n\n`);
    send({ choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] });
    send({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage });
    response.end('data: [DONE]\n\n');
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({
    ...base,
    object: 'chat.completion',
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
    usage,
  }));
}).listen(4174, '127.0.0.1');
