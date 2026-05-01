import { useEffect } from 'react';

const ENABLED = String(process.env.REACT_APP_CHAT_WIDGET_ENABLED || '').trim() === '1';
const SCRIPT_URL = String(process.env.REACT_APP_CHAT_WIDGET_SCRIPT_URL || '').trim();
const CHATLING_BOT_ID = String(process.env.REACT_APP_CHATLING_BOT_ID || '').trim();

function loadScriptOnce(src, id, extraAttrs) {
  if (!src) return;
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.async = true;
  s.src = src;
  if (extraAttrs) {
    Object.keys(extraAttrs).forEach((k) => s.setAttribute(k, extraAttrs[k]));
  }
  document.body.appendChild(s);
}

export function ChatWidget() {
  useEffect(() => {
    if (!ENABLED) return;

    if (CHATLING_BOT_ID) {
      window.chtlConfig = { chatbotId: CHATLING_BOT_ID };
      loadScriptOnce(
        'https://chatling.ai/js/embed.js',
        'chtl-script',
        { 'data-id': CHATLING_BOT_ID }
      );
      return;
    }

    if (SCRIPT_URL) {
      loadScriptOnce(SCRIPT_URL, 'recyclexapp-chat-widget');
      return;
    }

    window.__RECYCLEXCHAT__ = window.__RECYCLEXCHAT__ || {};
    loadScriptOnce(`${process.env.PUBLIC_URL || ''}/chat-widget.js`, 'recyclexapp-chat-widget-local');
  }, []);

  return null;
}

export default ChatWidget;
