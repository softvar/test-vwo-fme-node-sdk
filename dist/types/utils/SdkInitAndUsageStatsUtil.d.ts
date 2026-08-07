import { ServiceContainer } from '../services/ServiceContainer';
import { UsageStatsUtil } from './UsageStatsUtil';
/**
 * Sends an init called event to Wingify.
 * This event is triggered when the init function is called.
 * @param settingsFetchTime - Time taken to fetch settings in milliseconds.
 * @param sdkInitTime - Time taken to initialize the SDK in milliseconds.
 * @param serviceContainer - The service container instance.
 */
export declare function sendSdkInitEvent(
  settingsFetchTime: number,
  sdkInitTime: number,
  serviceContainer: ServiceContainer,
): Promise<void>;
/**
 * Sends a usage stats event to Wingify.
 * This event is triggered when the SDK is initialized.
 * @param usageStatsAccountId - The account ID used for usage-stats reporting.
 * @param serviceContainer - The service container instance.
 * @param usageStatsUtil - The usage-stats payload builder.
 */
export declare function sendSDKUsageStatsEvent(
  usageStatsAccountId: number,
  serviceContainer: ServiceContainer,
  usageStatsUtil: UsageStatsUtil,
): Promise<void>;
