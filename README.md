# agent.assert and agent.waitFor cannot judge the current URL

Reproduction for [tester-army/e2e#1514](https://github.com/tester-army/e2e/issues/1514).

The built-in judge never receives the current URL, so an instruction about it
fails even when the address matches. `buildPrompt` leaves `observation.path`
out of `<observation>`.

The project uses the published `e2e` and `@e2e-dev/web`. The whole app is
`app/server.mjs`, a static page with no dependencies.

## Run it

Set a model in `.env`, then:

```bash
npm install
npm test
```

| In `.env` | Model |
| --- | --- |
| `MODEL_URL` | an OpenAI-compatible server |
| `AI_GATEWAY_API_KEY` | `openai/gpt-6-luna-fast` through the Vercel AI Gateway |
| `OPENAI_API_KEY` | `gpt-6-luna` through the OpenAI API |

The first one set wins, counting your shell's environment too. `MODEL_NAME`
overrides the model.

Without a model, `npm run test:stub` runs the same tests on a stub and writes
every prompt to `.e2e/stub-prompts.log`, so you can see that the URL is not in
it. The stub says nothing about how a real model behaves.

## Expected and actual

| Test | Instruction | Expected | Actual |
| --- | --- | --- | --- |
| control | `toHaveURL('/page')` on `/page` | passes | passes |
| assert A | `The URL path is /page` on `/page` | passes | `ASSERTION_INCONCLUSIVE` |
| assert B | `The URL path is /other` on `/page` | `ASSERTION_FAILED` | `ASSERTION_INCONCLUSIVE` |
| waitFor A | `The URL path is /page` on `/page` | passes | `STEP_TIMEOUT` |
| waitFor B | `The URL path is /moved` on `/moving`, which moves to `/moved` after 3 s with the same content | passes | `STEP_TIMEOUT` |

The test titles stay neutral because the prompt carries them to the model.

`waitFor B` has a second cause: `waitFor` judges again only when
`observationShape` changes, and that shape ignores the location. `/moving`
moves to `/moved` after three seconds with `history.replaceState`, and the page
content stays the same, so the judge is asked once.

I ran this with `gpt-6-luna` through the OpenAI API.
