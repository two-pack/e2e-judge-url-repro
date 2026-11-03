import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

// The prompt carries the test's title to the model, so the titles say nothing
// about the expected verdict. The README's table lists what each one expects.
describe('url', () => {
  test('control', async ({ app, browser }) => {
    await app.open('/page');
    await expect(browser).toHaveURL('/page');
  });

  test('assert A', async ({ app, agent }) => {
    await app.open('/page');
    await agent.assert('The URL path is /page');
  });

  test('assert B', async ({ app, agent }) => {
    await app.open('/page');
    const failure = await agent.assert('The URL path is /other').catch((error: { code?: string }) => error);
    expect(failure?.code).toBe('ASSERTION_FAILED');
  });

  test('waitFor A', async ({ app, agent }) => {
    await app.open('/page');
    await agent.waitFor('The URL path is /page', { timeout: 10_000 });
  });

  test('waitFor B', async ({ app, agent }) => {
    await app.open('/moving');
    await agent.waitFor('The URL path is /moved', { timeout: 15_000, interval: 1_000 });
  });
});
