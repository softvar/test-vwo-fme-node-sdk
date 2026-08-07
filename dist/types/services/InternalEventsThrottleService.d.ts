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
import { ServiceContainer } from './ServiceContainer';
/**
 * Applies gating and sampling rules for internal SDK events
 * (`vwo_fmeSdkInit`, `vwo_sdkUsageStats`, and sampled `vwo_sdkDebug`).
 */
export declare class InternalEventsThrottleService {
  /** Injectable random source used for sampling checks (overridden in tests). */
  private readonly randomValueProvider;
  /**
   * Creates an internal-events throttle service bound to a service container.
   * @param _serviceContainer - The SDK service container (reserved for future settings access).
   * @param randomValueProvider - Optional provider for sampling randomness (used in tests).
   */
  constructor(_serviceContainer: ServiceContainer, randomValueProvider?: () => number);
  /**
   * Determines whether the SDK init internal event should be sent.
   * @param settings - The current settings document.
   * @returns True when the init event qualifies to be sent.
   */
  shouldSendSdkInitEvent(settings?: Record<string, any>): boolean;
  /**
   * Determines whether the SDK usage-stats internal event should be sent.
   * @param settings - The current settings document.
   * @returns True when the usage-stats event qualifies to be sent.
   */
  shouldSendUsageStatsEvent(settings?: Record<string, any>): boolean;
  /**
   * Determines whether a sampled debug internal event should be sent.
   * Always-send debug events bypass this method entirely.
   * @param settings - The current settings document.
   * @returns True when the sampled debug event qualifies to be sent.
   */
  shouldSendSampledDebugEvent(settings?: Record<string, any>): boolean;
}
