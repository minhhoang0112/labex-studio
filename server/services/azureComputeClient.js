import { ComputeManagementClient } from '@azure/arm-compute';
import { AzureCliCredential, ClientSecretCredential, ManagedIdentityCredential } from '@azure/identity';
import { cloudConfig, cloudError, enableProjectAzureCli } from './cloudConfig.js';

let cached;
export function azureClient() {
  const config = cloudConfig();
  if (!config.subscriptionId) throw cloudError('Chưa cấu hình AZURE_SUBSCRIPTION_ID. Chạy scripts/azure-login.ps1.', 503, 'CLOUD_AUTH_REQUIRED');
  if (cached) return cached;
  enableProjectAzureCli();
  let credential;
  if (config.authMode === 'service-principal') {
    const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
    if (![AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET].every(Boolean)) {
      throw cloudError('Thiếu cấu hình Service Principal Azure.', 503, 'CLOUD_AUTH_REQUIRED');
    }
    credential = new ClientSecretCredential(AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET);
  } else if (config.authMode === 'managed-identity') {
    credential = process.env.AZURE_CLIENT_ID ? new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID })
      : new ManagedIdentityCredential();
  } else if (config.authMode === 'cli') {
    credential = new AzureCliCredential({ processTimeoutInMs: 20000 });
  } else throw cloudError('AZURE_AUTH_MODE không hợp lệ.', 503, 'CLOUD_CONFIG_REQUIRED');
  cached = new ComputeManagementClient(credential, config.subscriptionId, { retryOptions: { maxRetries: 2 } });
  return cached;
}
