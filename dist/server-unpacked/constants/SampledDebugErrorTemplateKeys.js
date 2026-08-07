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
exports.SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS = void 0;
/**
 * Error log template keys (`msg_t`) that should be subject to debug-event sampling.
 *
 * Keys not listed here are treated as `ALWAYS_SEND` and bypass sampling checks.
 * Update this list when product defines additional errors to sample.
 *
 * Current set targets high-volume missing resource errors (event/feature not found).
 * Init/validation and network/settings errors are intentionally excluded and always send.
 */
exports.SAMPLED_DEBUG_ERROR_TEMPLATE_KEYS = new Set([
    'EVENT_NOT_FOUND',
    'FEATURE_NOT_FOUND',
    'FEATURE_NOT_FOUND_WITH_ID',
]);
//# sourceMappingURL=SampledDebugErrorTemplateKeys.js.map