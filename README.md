# QVAC Tagline Options Generator

Enter a product or service description and an on-device AI writes 3-5 grounded tagline/slogan options. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31011

Requires Node.js >= 22.17 (see `engines` in `package.json`).

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key.

1. `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` loads the model once at startup, before the HTTP server starts accepting requests.
2. Each request calls `completion()` with a one-shot example baked into the chat history (a real user/assistant turn, not just prose instructions) and streams the reply token-by-token via `run.tokenStream`.
3. `unloadModel({ modelId })` releases the model on `SIGINT`/`SIGTERM`.

The response is passed through `generate()` in `src/tagline.js`, which strips numbering/quotes/markdown, drops any line that looks like a refusal or an unrelated preamble sentence, and de-duplicates the result. If fewer than 3 usable taglines survive that filtering, a deterministic fallback (built directly from the input text, no model involved) is returned instead so the UI never shows an empty result.

### Example

Input:

> A mobile app that helps people track their daily water intake and reminds them to hydrate.

Output:

```
1. Never miss a sip again.
2. Hydration, made effortless.
3. Your daily dose of water, delivered.
4. Drink smarter, live better.
5. Small sips, big change.
```

This exact pair is also the one-shot example baked into the prompt (see `EXAMPLE_INPUT`/`EXAMPLE_OUTPUT` in `src/tagline.js`), and the code explicitly filters out any of these lines if the model parrots them back for an unrelated description.

## License

MIT
