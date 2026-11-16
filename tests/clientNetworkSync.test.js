import test from 'node:test';
import assert from 'node:assert/strict';
import {createClientNetworkSync} from '../server/services/clientNetworkSync.js';
function fixture({source='1.2.3.4',nsg='expected',old='5.6.7.8/32'}={}) {
  const env={WINDOWS_CLIENT_NETWORK_SYNC:'true'}; const calls=[];
  const config=()=>({authMode:'cli',subscriptionId:'sub',resourceGroup:'rg',vmName:'CLIENT01',rdpPort:3389});
  const rule={access:'Allow',direction:'Inbound',protocol:'Tcp',destinationPortRange:'3389',sourceAddressPrefix:old};
  const run=async args=>{
    calls.push(args);
    if(args[0]==='vm') return [{id:'nic'}];
    if(args[1]==='nic') return {networkSecurityGroup:{id:nsg==='expected'?'/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/LabEx-CLIENT01-NSG':'unexpected'},ipConfigurations:[{publicIPAddress:{id:'pip'}}]};
    if(args[1]==='public-ip') return {ipAddress:'20.219.60.228'};
    if(args[3]==='show') return rule;
    return {...rule,sourceAddressPrefix:args[args.indexOf('--source-address-prefixes')+1]};
  };
  return {env,calls,sync:createClientNetworkSync({env,config,run,getPublicIp:async()=>source})};
}
test('sync refreshes VM address and exactly one /32 rule; overlapping calls share work',async()=>{
  const f=fixture();
  const [a,b]=await Promise.all([f.sync({target:'client'}),f.sync({target:'client'})]);
  assert.deepEqual(a,b);assert.equal(f.env.AZURE_CLIENT_VM_IP,'20.219.60.228');
  const updates=f.calls.filter(a=>a[3]==='update');assert.equal(updates.length,1);
  assert.ok(updates[0].includes('1.2.3.4/32'));assert.ok(updates[0].includes('RDP-from-lab-gateway'));
  await f.sync({target:'client'});assert.equal(f.calls.length,5);
});
test('matching source requires no write; disabled/server targets do nothing',async()=>{
  const f=fixture({old:'1.2.3.4/32'});await f.sync({target:'client'});
  assert.equal(f.calls.filter(a=>a[3]==='update').length,0);
  const g=fixture();await g.sync({target:'server'});g.env.WINDOWS_CLIENT_NETWORK_SYNC='false';await g.sync({target:'client'});assert.equal(g.calls.length,0);
});
test('invalid source and mismatched NSG fail closed without mutations',async()=>{
  for(const opts of [{source:'10.1.2.3'},{source:'*'},{source:'bad'},{nsg:'wrong'}]){
    const f=fixture(opts);await assert.rejects(f.sync({target:'client'}),{code:'CLOUD_NETWORK_SYNC_FAILED'});
    assert.equal(f.calls.filter(a=>a[3]==='update').length,0);assert.equal(f.env.AZURE_CLIENT_VM_IP,undefined);
  }
});
