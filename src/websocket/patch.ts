/*!
 * Copyright 2024 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as webpack from '../webpack';

webpack.onInjected(() => {
  /**
   * COMPREHENSIVE TIMEOUT FIX FOR MEDIA UPLOADS AND PROTOCOL OPERATIONS
   *
   * This patch addresses multiple timeout issues:
   * 1. Protocol-level timeouts (sendIq, sendSmaxStanza) - increased to 10 minutes
   * 2. Network request timeouts - patches XMLHttpRequest and fetch
   * 3. Media upload operations - increases timeout for large files
   */

  // =================================================================
  // PART 1: PATCH PROTOCOL TIMEOUTS (sendIq, sendSmaxStanza)
  // =================================================================
  const sendIqModule = webpack.search(
    (m) => m.deprecatedSendIq && m.deprecatedSendIqWithoutRetry
  );

  if (sendIqModule) {
    // Wrap deprecatedSendIq to increase timeout
    const originalDeprecatedSendIq = sendIqModule.deprecatedSendIq;
    if (originalDeprecatedSendIq) {
      sendIqModule.deprecatedSendIq = function (
        stanzaData: any,
        ...args: any[]
      ) {
        // If args[0] is an options object with timeout, increase it
        if (args[0] && typeof args[0] === 'object') {
          // Set timeout to 10 minutes (600000ms) if not already set or if lower
          if (!args[0].timeout || args[0].timeout < 600000) {
            args[0].timeout = 600000;
          }
        } else {
          // If no options object, create one with extended timeout
          args[0] = { timeout: 600000 };
        }
        return originalDeprecatedSendIq.call(this, stanzaData, ...args);
      };
    }

    // Wrap deprecatedSendIqWithoutRetry to increase timeout
    const originalDeprecatedSendIqWithoutRetry =
      sendIqModule.deprecatedSendIqWithoutRetry;
    if (originalDeprecatedSendIqWithoutRetry) {
      sendIqModule.deprecatedSendIqWithoutRetry = function (
        stanzaData: any,
        ...args: any[]
      ) {
        // If args[0] is an options object with timeout, increase it
        if (args[0] && typeof args[0] === 'object') {
          // Set timeout to 10 minutes (600000ms) if not already set or if lower
          if (!args[0].timeout || args[0].timeout < 600000) {
            args[0].timeout = 600000;
          }
        } else {
          // If no options object, create one with extended timeout
          args[0] = { timeout: 600000 };
        }
        return originalDeprecatedSendIqWithoutRetry.call(
          this,
          stanzaData,
          ...args
        );
      };
    }
  }

  // Find the module that contains sendSmaxStanza
  const sendSmaxStanzaModule = webpack.search(
    (m) => m.sendSmaxStanza && m.sendPing
  );

  if (sendSmaxStanzaModule) {
    // Wrap sendSmaxStanza to increase timeout
    const originalSendSmaxStanza = sendSmaxStanzaModule.sendSmaxStanza;
    if (originalSendSmaxStanza) {
      sendSmaxStanzaModule.sendSmaxStanza = function (
        stanzaData: any,
        ...args: any[]
      ) {
        // If args[0] is an options object with timeout, increase it
        if (args[0] && typeof args[0] === 'object') {
          // Set timeout to 10 minutes (600000ms) if not already set or if lower
          if (!args[0].timeout || args[0].timeout < 600000) {
            args[0].timeout = 600000;
          }
        } else {
          // If no options object, create one with extended timeout
          args[0] = { timeout: 600000 };
        }
        return originalSendSmaxStanza.call(this, stanzaData, ...args);
      };
    }
  }

  // =================================================================
  // PART 2: PATCH BROWSER-LEVEL NETWORK TIMEOUTS
  // =================================================================
  // Patch XMLHttpRequest to increase timeout for media uploads
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    ...args: any[]
  ) {
    // eslint-disable-next-line prefer-rest-params, prefer-spread
    originalXHROpen.apply(this, args as any);

    // If this looks like a media upload request, set a longer timeout
    const url = args[1];
    const urlString = url?.toString() || '';
    if (
      urlString.includes('mms.whatsapp.net') ||
      urlString.includes('upload') ||
      urlString.includes('media')
    ) {
      // Set timeout to 10 minutes for media uploads
      this.timeout = 600000;
    }
  };

  // Patch fetch to include longer timeouts for media uploads
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();

    // If this looks like a media upload request, modify the signal to have a longer timeout
    if (
      url.includes('mms.whatsapp.net') ||
      url.includes('upload') ||
      url.includes('media')
    ) {
      // Create a new AbortController with a longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

      // Combine with existing signal if present
      const originalSignal = init?.signal;
      if (originalSignal) {
        originalSignal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          controller.abort();
        });
      }

      // Create new init object with our signal
      const newInit: RequestInit = {
        ...init,
        signal: controller.signal,
      };

      return originalFetch.call(window, input, newInit).finally(() => {
        clearTimeout(timeoutId);
      });
    }

    return originalFetch.call(window, input, init);
  };
});
