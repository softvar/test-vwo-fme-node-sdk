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
type InternalEventsRuntimeKey = keyof typeof Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT;
/**
 * Indicates whether the backend has already received an SDK init event for the account.
 * @param settings - The raw or normalized settings document.
 * @returns True when the account was initialized earlier.
 */
export declare function wasSdkInitializedEarlier(settings?: Record<string, any>): boolean;
/**
 * Resolves the runtime key used to read values from `sdkMetaInfo.sampling` and
 * `sdkMetaInfo.alwaysApplySampling`.
 * @returns The runtime key for the current environment.
 */
export declare function getInternalEventsRuntimeKey(): InternalEventsRuntimeKey;
/**
 * Returns the default sampling percentage for a runtime when settings omit or invalidate the value.
 * @param runtimeKey - The runtime key (`server`, `client`, or `serverless`).
 * @returns The default sampling percentage for that runtime.
 */
export declare function getDefaultSamplingPercent(runtimeKey: InternalEventsRuntimeKey): number;
/**
 * Normalizes a sampling percentage to the inclusive range [0, 100].
 * @param samplingValue - The raw value from settings.
 * @param runtimeKey - The runtime key used to resolve the default when the value is absent or invalid.
 * @returns A valid sampling percentage, or the runtime default when invalid.
 */
export declare function normalizeSamplingPercent(samplingValue: unknown, runtimeKey: InternalEventsRuntimeKey): number;
/**
 * Reads a per-runtime sampling percentage from a nested settings object.
 * @param runtimeSamplingConfig - The nested config (e.g. `sdkMetaInfo.sampling.usage`).
 * @param runtimeKey - The runtime key (`server`, `client`, or `serverless`).
 * @returns The sampling percentage for that runtime.
 */
export declare function getRuntimeSamplingPercent(
  runtimeSamplingConfig: Record<string, unknown> | undefined,
  runtimeKey: InternalEventsRuntimeKey,
): number;
/**
 * Reads the usage-stats sampling percentage for the current runtime.
 * @param settings - The raw or normalized settings document.
 * @returns The configured usage-stats sampling percentage (0–100).
 */
export declare function getUsageStatsSamplingPercent(settings?: Record<string, any>): number;
/**
 * Reads the debug-event sampling percentage for the current runtime.
 * @param settings - The raw or normalized settings document.
 * @returns The configured debug sampling percentage (0–100).
 */
export declare function getDebugEventSamplingPercent(settings?: Record<string, any>): number;
/**
 * Indicates whether sampling should be applied for the current runtime.
 * Reads `alwaysApplySampling.{server|client|serverless}`; defaults to false when absent as the server anyways dedupes the events.
 * @param settings - The raw or normalized settings document.
 * @returns True when sampling must be evaluated before sending an internal event.
 */
export declare function shouldApplyEventSampling(settings?: Record<string, any>): boolean;
/**
 * Evaluates whether an event qualifies under the configured sampling percentage.
 * @param samplingPercent - The configured sampling percentage (0–100).
 * @param randomValue - A random value in the range [0, 1). Defaults to `Math.random()`.
 * @returns True when the generated value falls within the sampling threshold.
 */
export declare function passesSamplingPercent(samplingPercent: number, randomValue?: number): boolean;
/**
 * Indicates whether a debug error template key is categorized as sampled.
 * @param messageTemplateKey - The error log template key (`msg_t`).
 * @returns True when the key is listed in {@link SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS}.
 */
export declare function isSampledDebugErrorTemplateKey(messageTemplateKey: string): boolean;
export {};
