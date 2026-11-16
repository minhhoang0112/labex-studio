import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import net from 'node:net';
import { getVmTargetConfig, cloudError } from './cloudConfig.js';

const exec = promisify(execFile);
async function cli(args) {
  const { stdout } = await exec(path.resolve('.tools/azure-cli/Scripts/python.exe'),
    ['-m', 'azure.cli', ...args, '--only-show-errors', '-o', 'json'],
    { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 });
  return JSON.parse(stdout);
}
export function publicV4(value) {
  if (typeof value !== 'string' || !net.isIPv4(value)) return false;
  const [a,b] = value.split('.').map(Number);
  return a !== 0 && a !== 10 && a !== 127 && a < 224 &&
    !(a===169 && b===254) && !(a===172 && b>=16 && b<=31) &&
    !(a===192 && b===168) && !(a===100 && b>=64 && b<=127);
}
export function createClientNetworkSync({ run = cli, config = getVmTargetConfig, env = process.env,
  getPublicIp = async () => (await (await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(6000) })).text()).trim(), now = Date.now } = {}) {
  let pending, cached, expires = 0;
  return async function sync({ target } = {}) {
    if (target !== 'client' || env.WINDOWS_CLIENT_NETWORK_SYNC !== 'true') return null;
    if (cached && now() < expires) return cached;
    if (pending) return pending;
    pending = (async () => {
      const c=config('client');
      if(c.authMode !== 'cli' || !c.subscriptionId) throw Error('CLI configuration required');
      const az = args => run([...args,'--subscription',c.subscriptionId]);
      const source=await getPublicIp();
      if(!publicV4(source)) throw Error('Invalid gateway IP');
      const vm=await az(['vm','show','-g',c.resourceGroup,'-n',c.vmName,'--query','networkProfile.networkInterfaces']);
      const nic=vm.length===1?vm[0]:vm.find(x=>x.primary);
      if(!nic?.id) throw Error('Ambiguous VM NIC');
      const network=await az(['network','nic','show','--ids',nic.id]);
      const expectedNsg=`/subscriptions/${c.subscriptionId}/resourceGroups/${c.resourceGroup}/providers/Microsoft.Network/networkSecurityGroups/${env.AZURE_CLIENT_RDP_NSG || 'LabEx-CLIENT01-NSG'}`;
      if(network.networkSecurityGroup?.id?.toLowerCase() !== expectedNsg.toLowerCase()) throw Error('Unexpected NIC NSG');
      const configs=network.ipConfigurations || [];
      const primary=configs.length===1?configs[0]:configs.find(x=>x.primary);
      if(!primary?.publicIPAddress?.id) throw Error('No primary public IP');
      const address=await az(['network','public-ip','show','--ids',primary.publicIPAddress.id]);
      if(!publicV4(address.ipAddress)) throw Error('VM public IPv4 unavailable');
      const ruleArgs=['-g',c.resourceGroup,'--nsg-name',env.AZURE_CLIENT_RDP_NSG || 'LabEx-CLIENT01-NSG','-n','RDP-from-lab-gateway'];
      const rule=await az(['network','nsg','rule','show',...ruleArgs]);
      if(rule.access!=='Allow' || rule.direction!=='Inbound' || rule.protocol?.toLowerCase()!=='tcp' || rule.destinationPortRange!==String(c.rdpPort) || rule.destinationPortRanges?.length) throw Error('Unexpected RDP rule');
      const cidr=source+'/32';
      const changed=rule.sourceAddressPrefix!==cidr || Boolean(rule.sourceAddressPrefixes?.length);
      if(changed) {
        const updated=await az(['network','nsg','rule','update',...ruleArgs,'--source-address-prefixes',cidr]);
        if(updated.sourceAddressPrefix!==cidr || updated.sourceAddressPrefixes?.length) throw Error('Rule update not confirmed');
      }
      // Runtime only: always rediscover after restart; never rewrite secrets/config files.
      env.AZURE_CLIENT_VM_IP=address.ipAddress;
      cached={vmIp:address.ipAddress,gatewayIp:source,changed,checkedAt:new Date(now()).toISOString()};
      expires=now()+30000;
      return cached;
    })().catch(() => { throw cloudError('Không tự đồng bộ được IP/RDP CLIENT01. Kiểm tra đăng nhập Azure và kết nối Internet rồi bấm Kết nối lại; hệ thống không mở rộng quyền mạng.',503,'CLOUD_NETWORK_SYNC_FAILED'); })
      .finally(()=>{pending=null;});
    return pending;
  };
}
export const syncClientNetwork = createClientNetworkSync();
