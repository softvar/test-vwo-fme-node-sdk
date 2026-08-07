"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalEventsThrottleService = void 0;
var InternalEventsRuntimeUtil_1 = require("../utils/InternalEventsRuntimeUtil");
/**
 * Applies gating and sampling rules for internal SDK events
 * (`vwo_fmeSdkInit`, `vwo_sdkUsageStats`, and sampled `vwo_sdkDebug`).
 */
var InternalEventsThrottleService = /** @class */ (function () {
    /**
     * Creates an internal-events throttle service bound to a service container.
     * @param _serviceContainer - The SDK service container (reserved for future settings access).
     * @param randomValueProvider - Optional provider for sampling randomness (used in tests).
     */
    function InternalEventsThrottleService(_serviceContainer, randomValueProvider) {
        if (randomValueProvider === void 0) { randomValueProvider = Math.random; }
        this.randomValueProvider = randomValueProvider;
    }
    /**
     * Determines whether the SDK init internal event should be sent.
     * @param settings - The current settings document.
     * @returns True when the init event qualifies to be sent.
     */
    InternalEventsThrottleService.prototype.shouldSendSdkInitEvent = function (settings) {
        if (settings === void 0) { settings = {}; }
        return !(0, InternalEventsRuntimeUtil_1.wasSdkInitializedEarlier)(settings);
    };
    /**
     * Determines whether the SDK usage-stats internal event should be sent.
     * @param settings - The current settings document.
     * @returns True when the usage-stats event qualifies to be sent.
     */
    InternalEventsThrottleService.prototype.shouldSendUsageStatsEvent = function (settings) {
        if (settings === void 0) { settings = {}; }
        // if the alwaysApplySampling flag is false then we need not to sample and send that event directly.
        if (!(0, InternalEventsRuntimeUtil_1.shouldApplyEventSampling)(settings)) {
            return true;
        }
        var usageStatsSamplingPercent = (0, InternalEventsRuntimeUtil_1.getUsageStatsSamplingPercent)(settings);
        return (0, InternalEventsRuntimeUtil_1.passesSamplingPercent)(usageStatsSamplingPercent, this.randomValueProvider());
    };
    /**
     * Determines whether a sampled debug internal event should be sent.
     * Always-send debug events bypass this method entirely.
     * @param settings - The current settings document.
     * @returns True when the sampled debug event qualifies to be sent.
     */
    InternalEventsThrottleService.prototype.shouldSendSampledDebugEvent = function (settings) {
        if (settings === void 0) { settings = {}; }
        // if the alwaysApplySampling flag is false then we need not to sample and send that event directly.
        if (!(0, InternalEventsRuntimeUtil_1.shouldApplyEventSampling)(settings)) {
            return true;
        }
        var debugSamplingPercent = (0, InternalEventsRuntimeUtil_1.getDebugEventSamplingPercent)(settings);
        return (0, InternalEventsRuntimeUtil_1.passesSamplingPercent)(debugSamplingPercent, this.randomValueProvider());
    };
    return InternalEventsThrottleService;
}());
exports.InternalEventsThrottleService = InternalEventsThrottleService;
//# sourceMappingURL=InternalEventsThrottleService.js.map