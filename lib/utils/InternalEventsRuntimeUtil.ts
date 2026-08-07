/**
 * Copyright 2024-2026 Wingify Software Pvt. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Constants } from '../constants';
import { SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS } from '../constants/SampledDebugErrorTemplateKeys';

type InternalEventsRuntimeKey = keyof typeof Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT;

/**
 * Indicates whether the backend has already received an SDK init event for the account.
 * @param settings - The raw or normalized settings document.
 * @returns True when the account was initialized earlier.
 */
export function wasSdkInitializedEarlier(settings: Record<string, any> = {}): boolean {
  return settings?.sdkMetaInfo?.wasInitializedEarlier === true;
}

/**
 * Resolves the runtime key used to read values from `sdkMetaInfo.sampling` and
 * `sdkMetaInfo.alwaysApplySampling`.
 * @returns The runtime key for the current environment.
 */
export function getInternalEventsRuntimeKey(): InternalEventsRuntimeKey {
  if (typeof process === 'undefined') {
    // process is absent — could be browser or edge/serverless
    if (typeof XMLHttpRequest !== 'undefined') {
      return 'client'; // browser: no process, but XHR exists
    }
    return 'serverless'; // edge environment (Cloudflare Workers, Vercel Edge, Deno): no process, no XHR
  }

  return 'server'; // any Node.js environment (regular server, AWS Lambda, Cloud Functions, etc.)
}

/**
 * Returns the default sampling percentage for a runtime when settings omit or invalidate the value.
 * @param runtimeKey - The runtime key (`server`, `client`, or `serverless`).
 * @returns The default sampling percentage for that runtime.
 */
export function getDefaultSamplingPercent(runtimeKey: InternalEventsRuntimeKey): number {
  return Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT[runtimeKey];
}

/**
 * Normalizes a sampling percentage to the inclusive range [0, 100].
 * @param samplingValue - The raw value from settings.
 * @param runtimeKey - The runtime key used to resolve the default when the value is absent or invalid.
 * @returns A valid sampling percentage, or the runtime default when invalid.
 */
export function normalizeSamplingPercent(samplingValue: unknown, runtimeKey: InternalEventsRuntimeKey): number {
  if (typeof samplingValue === 'number' && samplingValue >= 0 && samplingValue <= 100) {
    return samplingValue;
  }

  return getDefaultSamplingPercent(runtimeKey);
}

/**
 * Reads a per-runtime sampling percentage from a nested settings object.
 * @param runtimeSamplingConfig - The nested config (e.g. `sdkMetaInfo.sampling.usage`).
 * @param runtimeKey - The runtime key (`server`, `client`, or `serverless`).
 * @returns The sampling percentage for that runtime.
 */
export function getRuntimeSamplingPercent(
  runtimeSamplingConfig: Record<string, unknown> | undefined,
  runtimeKey: InternalEventsRuntimeKey,
): number {
  return normalizeSamplingPercent(runtimeSamplingConfig?.[runtimeKey], runtimeKey);
}

/**
 * Reads the usage-stats sampling percentage for the current runtime.
 * @param settings - The raw or normalized settings document.
 * @returns The configured usage-stats sampling percentage (0–100).
 */
export function getUsageStatsSamplingPercent(settings: Record<string, any> = {}): number {
  const usageSamplingConfig =
    settings?.[Constants.INTERNAL_EVENTS_SAMPLING_KEY]?.[Constants.INTERNAL_EVENTS_USAGE_SAMPLING_KEY];

  return getRuntimeSamplingPercent(usageSamplingConfig, getInternalEventsRuntimeKey());
}

/**
 * Reads the debug-event sampling percentage for the current runtime.
 * @param settings - The raw or normalized settings document.
 * @returns The configured debug sampling percentage (0–100).
 */
export function getDebugEventSamplingPercent(settings: Record<string, any> = {}): number {
  const debugSamplingConfig =
    settings?.[Constants.INTERNAL_EVENTS_SAMPLING_KEY]?.[Constants.INTERNAL_EVENTS_DEBUG_SAMPLING_KEY];

  return getRuntimeSamplingPercent(debugSamplingConfig, getInternalEventsRuntimeKey());
}

/**
 * Indicates whether sampling should be applied for the current runtime.
 * Reads `alwaysApplySampling.{server|client|serverless}`; defaults to false when absent as the server anyways dedupes the events.
 * @param settings - The raw or normalized settings document.
 * @returns True when sampling must be evaluated before sending an internal event.
 */
export function shouldApplyEventSampling(settings: Record<string, any> = {}): boolean {
  const alwaysApplyConfig = settings?.[Constants.INTERNAL_EVENTS_ALWAYS_APPLY_SAMPLING_KEY];
  const runtimeFlag = alwaysApplyConfig?.[getInternalEventsRuntimeKey()];

  if (typeof runtimeFlag === 'boolean') {
    return runtimeFlag;
  }

  return Constants.INTERNAL_EVENTS_DEFAULT_ALWAYS_APPLY_SAMPLING;
}

/**
 * Evaluates whether an event qualifies under the configured sampling percentage.
 * @param samplingPercent - The configured sampling percentage (0–100).
 * @param randomValue - A random value in the range [0, 1). Defaults to `Math.random()`.
 * @returns True when the generated value falls within the sampling threshold.
 */
export function passesSamplingPercent(samplingPercent: number, randomValue: number = Math.random()): boolean {
  const normalizedRandomPercent = Math.floor(randomValue * 101);
  return normalizedRandomPercent <= samplingPercent;
}

/**
 * Indicates whether a debug error template key is categorized as sampled.
 * @param messageTemplateKey - The error log template key (`msg_t`).
 * @returns True when the key is listed in {@link SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS}.
 */
export function isSampledDebugErrorTemplateKey(messageTemplateKey: string): boolean {
  if (!messageTemplateKey) {
    return false;
  }

  return SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS.has(messageTemplateKey);
}
