/**
 * Chatling chatbot embed.
 *
 * How to fill this in:
 * 1) Create an account at https://chatling.ai and create a Chatbot.
 * 2) In Chatling, go to: Chatbot → Deploy → Embed (or "Install on website").
 * 3) Copy the Chatbot ID (looks like a UUID/number) and paste it below.
 *
 * You can either:
 *   (a) hardcode the ID here in CHATLING_BOT_ID, or
 *   (b) set REACT_APP_CHATLING_BOT_ID in frontend/reloop/.env and restart `npm start`.
 *
 * Source pattern: https://dev.to/limacodes/free-ai-chatbot-options-with-axios-and-reactjs-4h27
 */

(function (window, document) {
  if (window.__reloopChatlingLoaded) return;
  window.__reloopChatlingLoaded = true;

  // Prefer env var if present; otherwise set CHATLING_BOT_ID below.
  var CHATLING_BOT_ID = '';

  // Read env-provided id injected by the app via window.__RELOOP_CHAT__
  try {
    if (window.__RELOOP_CHAT__ && window.__RELOOP_CHAT__.chatlingBotId) {
      CHATLING_BOT_ID = String(window.__RELOOP_CHAT__.chatlingBotId);
    }
  } catch (e) {
    // ignore
  }

  if (!CHATLING_BOT_ID) {
    // Not configured yet — no-op.
    return;
  }

  window.chtlConfig = { chatbotId: CHATLING_BOT_ID };

  var s = document.createElement('script');
  s.async = true;
  s.type = 'text/javascript';
  s.src = 'https://chatling.ai/js/embed.js';
  s.setAttribute('data-id', CHATLING_BOT_ID);
  s.setAttribute('id', 'chtl-script');
  document.body.appendChild(s);
})(window, document);
