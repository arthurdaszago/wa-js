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
   * 1. WhatsApp Constants - increases thumbnail upload timeout from 3s to 10 minutes
   * 2. Protocol-level timeouts (sendIq, sendSmaxStanza) - increased to 10 minutes
   * 3. Network request timeouts - patches XMLHttpRequest and fetch
   * 4. Media upload operations - increases timeout for large files
   */

  console.log('[WA.js Timeout Patch] Starting to apply patches...');

  // =================================================================
  // PART 1: PATCH WHATSAPP CONSTANTS (MMS_THUMBNAIL_UPLOAD_TIMEOUT)
  // =================================================================
  // This is CRITICAL for video uploads - default is only 3 seconds!
  const constantsModule = webpack.search(
    (m) => m.MMS_THUMBNAIL_UPLOAD_TIMEOUT === 3000
  );

  if (constantsModule) {
    // Increase thumbnail upload timeout from 3 seconds to 10 minutes
    constantsModule.MMS_THUMBNAIL_UPLOAD_TIMEOUT = 600000;
    console.log(
      '[WA.js] ✓ Patched MMS_THUMBNAIL_UPLOAD_TIMEOUT: 3000ms -> 600000ms'
    );
  } else {
    console.warn(
      '[WA.js] ✗ Could not find MMS_THUMBNAIL_UPLOAD_TIMEOUT constant'
    );
  }

  // Also patch uploadThumbnail function to use extended timeout
  const uploadThumbnailModule = webpack.search(
    (m) => m.default && typeof m.default === 'function'
  );

  if (uploadThumbnailModule?.default) {
    const originalUploadThumbnail = uploadThumbnailModule.default;
    uploadThumbnailModule.default = function (data: any) {
      // Override timeout if present
      if (data && typeof data === 'object' && 'timeout' in data) {
        data.timeout = 600000; // 10 minutes
      }
      return originalUploadThumbnail.call(this, data);
    };
  }

  // =================================================================
  // PART 2: PATCH PROTOCOL TIMEOUTS (sendIq, sendSmaxStanza)
  // =================================================================
  const sendIqModule = webpack.search(
    (m) => m.deprecatedSendIq && m.deprecatedSendIqWithoutRetry
  );

  if (sendIqModule) {
    console.log('[WA.js] ✓ Found sendIq module, applying patches...');
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
      console.log('[WA.js] ✓ Patched deprecatedSendIq timeout');
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
      console.log('[WA.js] ✓ Patched deprecatedSendIqWithoutRetry timeout');
    }
  } else {
    console.warn('[WA.js] ✗ Could not find sendIq module');
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
      console.log('[WA.js] ✓ Patched sendSmaxStanza timeout');
    }
  } else {
    console.warn('[WA.js] ✗ Could not find sendSmaxStanza module');
  }

  // =================================================================
  // PART 3: PATCH BROWSER-LEVEL NETWORK TIMEOUTS
  // =================================================================
  console.log('[WA.js] ✓ Patching browser XHR and fetch timeouts...');
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

  console.log('[WA.js] ========================================');
  console.log('[WA.js] Timeout patches applied successfully!');
  console.log('[WA.js] All timeouts increased to 10 minutes (600000ms)');
  console.log('[WA.js] ========================================');
});
