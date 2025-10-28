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
   * Increase protocol timeout for sendIq and sendSmaxStanza operations
   * to handle large files and slow connections better
   */

  // Find the module that contains sendIq functions
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
});
