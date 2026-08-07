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

import { Constants } from '../../../lib/constants';
import {
  getDebugEventSamplingPercent,
  getDefaultSamplingPercent,
  getInternalEventsRuntimeKey,
  getUsageStatsSamplingPercent,
  isSampledDebugErrorTemplateKey,
  normalizeSamplingPercent,
  passesSamplingPercent,
  shouldApplyEventSampling,
  wasSdkInitializedEarlier,
} from '../../../lib/utils/InternalEventsRuntimeUtil';
import { InternalEventsThrottleService } from '../../../lib/services/InternalEventsThrottleService';
import { ServiceContainer } from '../../../lib/services/ServiceContainer';

const mockSamplingSettings = {
  sdkMetaInfo: {
    wasInitializedEarlier: false,
  },
  sampling: {
    usage: { server: 20, client: 30, serverless: 40 },
    debug: { server: 50, client: 60, serverless: 70 },
  },
  alwaysApplySampling: {
    server: true,
    client: false,
    serverless: false,
  },
};

const originalProcess = global.process;
const originalRequire = (global as any).require;
const originalXmlHttpRequest = (global as any).XMLHttpRequest;

const mockServerSideRuntime = (): void => {
  global.process = originalProcess;
  (global as any).require = originalRequire;
  (global as any).XMLHttpRequest = originalXmlHttpRequest;
};

const mockBrowserRuntime = (): void => {
  (global as any).process = undefined;
  (global as any).require = originalRequire;
  (global as any).XMLHttpRequest = function XMLHttpRequest() {};
};

const mockServerlessRuntime = (): void => {
  (global as any).process = undefined;
  (global as any).require = originalRequire;
  (global as any).XMLHttpRequest = undefined;
};

const restoreRuntimeGlobals = (): void => {
  global.process = originalProcess;
  (global as any).require = originalRequire;
  (global as any).XMLHttpRequest = originalXmlHttpRequest;
};

describe('InternalEventsRuntimeUtil', () => {
  afterEach(() => {
    restoreRuntimeGlobals();
  });

  it('should treat missing sdkMetaInfo as not initialized earlier', () => {
    expect(wasSdkInitializedEarlier({})).toBe(false);
  });

  it('should read wasInitializedEarlier from settings', () => {
    expect(wasSdkInitializedEarlier({ sdkMetaInfo: { wasInitializedEarlier: true } })).toBe(true);
  });

  it('should return runtime-specific default sampling when the value is absent or invalid', () => {
    expect(getDefaultSamplingPercent('server')).toBe(Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT.server);
    expect(getDefaultSamplingPercent('client')).toBe(Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT.client);
    expect(getDefaultSamplingPercent('serverless')).toBe(Constants.INTERNAL_EVENTS_DEFAULT_SAMPLING_PERCENT.serverless);
    expect(normalizeSamplingPercent(undefined, 'server')).toBe(10);
    expect(normalizeSamplingPercent(undefined, 'client')).toBe(1);
    expect(normalizeSamplingPercent(undefined, 'serverless')).toBe(1);
  });

  it('should detect server-side Node runtime when process is defined', () => {
    mockServerSideRuntime();

    expect(getInternalEventsRuntimeKey()).toBe('server');
  });

  it('should detect browser runtime when process is undefined and XMLHttpRequest exists', () => {
    mockBrowserRuntime();

    expect(getInternalEventsRuntimeKey()).toBe('client');
  });

  it('should detect serverless runtime when process is undefined and XMLHttpRequest is unavailable', () => {
    mockServerlessRuntime();

    expect(getInternalEventsRuntimeKey()).toBe('serverless');
  });

  it('should read runtime defaults from settings when sampling values are absent', () => {
    mockServerSideRuntime();

    expect(getUsageStatsSamplingPercent({})).toBe(10);
    expect(getDebugEventSamplingPercent({})).toBe(10);
  });

  it('should read usage-stats sampling for the server runtime', () => {
    mockServerSideRuntime();

    expect(getUsageStatsSamplingPercent(mockSamplingSettings)).toBe(20);
    expect(getInternalEventsRuntimeKey()).toBe('server');
  });

  it('should read debug sampling for the serverless runtime', () => {
    mockServerlessRuntime();

    expect(getDebugEventSamplingPercent(mockSamplingSettings)).toBe(70);
    expect(getInternalEventsRuntimeKey()).toBe('serverless');
  });

  it('should read alwaysApplySampling for the current runtime from settings', () => {
    mockServerSideRuntime();
    expect(shouldApplyEventSampling(mockSamplingSettings)).toBe(true);
    expect(shouldApplyEventSampling({})).toBe(false);
  });

  it('should read alwaysApplySampling.client on browser runtime', () => {
    mockBrowserRuntime();
    expect(shouldApplyEventSampling(mockSamplingSettings)).toBe(false);
    expect(
      shouldApplyEventSampling({
        alwaysApplySampling: { client: true },
      }),
    ).toBe(true);
  });

  it('should pass sampling when the random value is within the threshold', () => {
    expect(passesSamplingPercent(20, 0.1)).toBe(true);
  });

  it('should fail sampling when the random value is above the threshold', () => {
    expect(passesSamplingPercent(20, 0.99)).toBe(false);
  });

  it('should return true for keys in the sampled debug set', () => {
    expect(isSampledDebugErrorTemplateKey('EXECUTION_FAILED')).toBe(true);
    expect(isSampledDebugErrorTemplateKey('NETWORK_CALL_FAILED')).toBe(true);
  });

  it('should return false for keys not in the sampled debug set', () => {
    expect(isSampledDebugErrorTemplateKey('INVALID_OPTIONS')).toBe(false);
  });

  it('should return false for empty debug template keys', () => {
    expect(isSampledDebugErrorTemplateKey('')).toBe(false);
  });
});

describe('InternalEventsThrottleService', () => {
  let serviceContainer: ServiceContainer;
  let throttleService: InternalEventsThrottleService;

  beforeEach(() => {
    serviceContainer = new ServiceContainer({ accountId: 1, sdkKey: 'test-key' } as any);
    throttleService = new InternalEventsThrottleService(serviceContainer, () => 0);
  });

  afterEach(() => {
    restoreRuntimeGlobals();
  });

  describe('shouldSendSdkInitEvent', () => {
    it('should block init when the account was initialized earlier', () => {
      mockServerSideRuntime();

      expect(
        throttleService.shouldSendSdkInitEvent({
          sdkMetaInfo: { wasInitializedEarlier: true },
        }),
      ).toBe(false);
    });

    it('should allow init when wasInitializedEarlier is false', () => {
      mockServerSideRuntime();

      expect(throttleService.shouldSendSdkInitEvent({ sdkMetaInfo: {} })).toBe(true);
    });

    it('should allow init on serverless when wasInitializedEarlier is false', () => {
      mockServerlessRuntime();

      expect(throttleService.shouldSendSdkInitEvent({ sdkMetaInfo: {} })).toBe(true);
    });
  });

  describe('shouldSendUsageStatsEvent', () => {
    it('should always allow usage stats on server when alwaysApplySampling.server is false', () => {
      mockServerSideRuntime();

      expect(
        throttleService.shouldSendUsageStatsEvent({
          alwaysApplySampling: { server: false },
          sampling: { usage: { server: 0 } },
        }),
      ).toBe(true);
    });

    it('should apply usage-stats sampling on server when alwaysApplySampling.server is true', () => {
      mockServerSideRuntime();
      const samplingThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        samplingThrottleService.shouldSendUsageStatsEvent({
          alwaysApplySampling: { server: true },
          sampling: { usage: { server: 0 } },
        }),
      ).toBe(false);
    });

    it('should always allow usage stats on serverless when alwaysApplySampling.serverless is false', () => {
      mockServerlessRuntime();
      const serverlessThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        serverlessThrottleService.shouldSendUsageStatsEvent({
          sampling: { usage: { serverless: 0 } },
        }),
      ).toBe(true);
    });

    it('should apply usage-stats sampling on serverless when alwaysApplySampling.serverless is true', () => {
      mockServerlessRuntime();
      const serverlessThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        serverlessThrottleService.shouldSendUsageStatsEvent({
          alwaysApplySampling: { serverless: true },
          sampling: { usage: { serverless: 0 } },
        }),
      ).toBe(false);
    });

    it('should not apply usage-stats sampling on browser when alwaysApplySampling.client is false', () => {
      mockBrowserRuntime();
      expect(shouldApplyEventSampling({})).toBe(false);
    });

    it('should apply usage-stats sampling on browser when alwaysApplySampling.client is true', () => {
      mockBrowserRuntime();
      const clientThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        clientThrottleService.shouldSendUsageStatsEvent({
          alwaysApplySampling: { client: true },
          sampling: { usage: { client: 0 } },
        }),
      ).toBe(false);
    });
  });

  describe('shouldSendSampledDebugEvent', () => {
    it('should always allow sampled debug events when alwaysApplySampling is false', () => {
      mockServerSideRuntime();
      const sampledThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        sampledThrottleService.shouldSendSampledDebugEvent({
          sampling: { debug: { server: 0 } },
        }),
      ).toBe(true);
    });

    it('should apply debug sampling when alwaysApplySampling is true', () => {
      mockServerSideRuntime();

      expect(throttleService.shouldSendSampledDebugEvent(mockSamplingSettings)).toBe(true);
    });

    it('should block sampled debug events when alwaysApplySampling is true and sampling percent is zero', () => {
      mockServerSideRuntime();
      const sampledThrottleService = new InternalEventsThrottleService(serviceContainer, () => 1);

      expect(
        sampledThrottleService.shouldSendSampledDebugEvent({
          alwaysApplySampling: { server: true },
          sampling: { debug: { server: 0 } },
        }),
      ).toBe(false);
    });
  });
});
