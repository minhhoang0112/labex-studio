"""Read-only Azure inventory and public retail pricing; never deploys or starts VMs.

Run from the workspace root. Uses the existing Azure CLI login, never exports tokens.
The output deliberately excludes account IDs, public IPs and guest credentials.
"""
import concurrent.futures
import argparse
import datetime
import json
from pathlib import Path
import subprocess
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PYTHON = ROOT / '.tools/azure-cli/Scripts/python.exe'
REGION = 'centralindia'
GROUP = 'LabEx-India-RG'


def az(args, query):
    result = subprocess.run(
        [str(PYTHON), '-m', 'azure.cli', *args, '--query', query,
         '--output', 'json', '--only-show-errors'],
        capture_output=True, text=True, encoding='utf-8', timeout=120,
    )
    if result.returncode:
        # CLI error text may contain account identifiers. Keep it local to CLI;
        # report only a generic failure rather than copying it into artifacts.
        return {'error': 'Azure CLI query failed; check login/permissions separately.'}
    return json.loads(result.stdout)


def retail(filter_text):
    url = 'https://prices.azure.com/api/retail/prices?' + urllib.parse.urlencode(
        {'$filter': filter_text, 'currencyCode': 'USD'})
    rows = []
    while url:
        with urllib.request.urlopen(url, timeout=40) as response:
            page = json.load(response)
        for item in page.get('Items', []):
            if item.get('type') == 'Consumption':
                rows.append({key: item.get(key) for key in (
                    'productName', 'skuName', 'armSkuName', 'meterName',
                    'retailPrice', 'unitOfMeasure', 'currencyCode',
                    'effectiveStartDate', 'isPrimaryMeterRegion', 'tierMinimumUnits')})
        url = page.get('NextPageLink')
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keys', help='Comma-separated checks to refresh in the existing report.')
    options = parser.parse_args()
    jobs = {
        'subscription': lambda: az(['account', 'show'], '{name:name,state:state}'),
        'vm': lambda: az(['vm', 'show', '-g', GROUP, '-n', 'LabEx-WinServer', '-d'],
                        '{name:name,location:location,size:hardwareProfile.vmSize,state:powerState,image:storageProfile.imageReference,security:securityProfile.securityType}'),
        'clientVm': lambda: az(['vm', 'show', '-g', GROUP, '-n', 'LabEx-CLIENT01', '-d'],
                              '{name:name,location:location,size:hardwareProfile.vmSize,state:powerState,image:storageProfile.imageReference,security:securityProfile.securityType,osDisk:storageProfile.osDisk.name}'),
        'clientSchedule': lambda: az(['resource', 'show', '-g', GROUP, '--resource-type', 'Microsoft.DevTestLab/schedules', '-n', 'shutdown-computevm-LabEx-CLIENT01', '--api-version', '2018-09-15'],
                                    '{enabled:properties.status,time:properties.dailyRecurrence.time,timezone:properties.timeZoneId,task:properties.taskType}'),
        'quota': lambda: az(['vm', 'list-usage', '-l', REGION],
                           "[?name.value=='cores' || contains(name.value, 'standardB')].{family:name.value,current:currentValue,limit:limit}"),
        'disks': lambda: az(['disk', 'list', '-g', GROUP],
                           '[].{name:name,sizeGiB:diskSizeGB,sku:sku.name,state:diskState,hyperVGeneration:hyperVGeneration}'),
        'snapshots': lambda: az(['snapshot', 'list', '-g', GROUP],
                               '[].{name:name,sizeGiB:diskSizeGB,sku:sku.name,state:provisioningState}'),
        'networks': lambda: az(['network', 'vnet', 'list', '-g', GROUP],
                              '[].{name:name,prefixes:addressSpace.addressPrefixes,subnets:subnets[].{name:name,prefix:addressPrefix}}'),
        'nsgRules': lambda: az(['network', 'nsg', 'list', '-g', GROUP],
                              '[].{name:name,rules:securityRules[].{name:name,direction:direction,access:access,priority:priority,source:sourceAddressPrefix,sourceList:sourceAddressPrefixes,port:destinationPortRange,ports:destinationPortRanges}}'),
        'skuCandidates': lambda: az(['vm', 'list-skus', '-l', REGION, '--resource-type', 'virtualMachines', '--all'],
                                    "[?name=='Standard_B2ats_v2' || name=='Standard_B2as_v2' || name=='Standard_B2s' || name=='Standard_D2as_v5'].{name:name,family:family,restrictions:restrictions,capabilities:capabilities[?name=='vCPUs' || name=='MemoryGB' || name=='HyperVGenerations' || name=='TrustedLaunchDisabled']}"),
        'windows11ImageSkus': lambda: az(['vm', 'image', 'list-skus', '-l', REGION, '-p', 'MicrosoftWindowsDesktop', '-f', 'windows-11'], '[].name'),
        'selectedWindows11Image': lambda: az(['vm', 'image', 'show', '-l', REGION, '--urn', 'MicrosoftWindowsDesktop:windows-11:win11-25h2-ent:latest'],
                                            '{name:name,architecture:architecture,hyperVGeneration:hyperVGeneration,osDiskGiB:osDiskImage.sizeInGB,features:features}'),
        'sizeSpecs': lambda: az(['vm', 'list-sizes', '-l', REGION],
                               "[?name=='Standard_B2ats_v2' || name=='Standard_B2as_v2'].{name:name,cores:numberOfCores,memoryMiB:memoryInMB}"),
        'vmRetail': lambda: retail("armRegionName eq 'centralindia' and serviceName eq 'Virtual Machines' and (armSkuName eq 'Standard_B2ats_v2' or armSkuName eq 'Standard_B2as_v2' or armSkuName eq 'Standard_B2s' or armSkuName eq 'Standard_D2as_v5')"),
        'client4GbRetail': lambda: retail("armRegionName eq 'centralindia' and serviceName eq 'Virtual Machines' and armSkuName eq 'Standard_B2als_v2'"),
        'diskRetail': lambda: retail("armRegionName eq 'centralindia' and serviceName eq 'Storage' and (contains(productName, 'Standard SSD Managed Disks') or contains(productName, 'Standard HDD Managed Disks') or contains(productName, 'Premium SSD Managed Disks'))"),
        'ipRetail': lambda: retail("armRegionName eq 'centralindia' and serviceName eq 'Virtual Network' and contains(productName, 'IP Addresses')"),
    }
    output = ROOT / '.artifacts/azure-lab-plan-2026-10-20.json'
    report = json.loads(output.read_text(encoding='utf-8')) if options.keys and output.exists() else {}
    report.update({'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'readOnly': True, 'region': REGION, 'currency': 'USD',
              'pricingCaveat': 'Public retail, not invoice or remaining student credit; excludes taxes and unlisted resources.'})
    if options.keys:
        selected = options.keys.split(',')
        unknown = set(selected) - jobs.keys()
        if unknown:
            parser.error('Unknown check names: ' + ','.join(sorted(unknown)))
        jobs = {key: jobs[key] for key in selected}
    output.parent.mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        pending = {pool.submit(job): name for name, job in jobs.items()}
        for future in concurrent.futures.as_completed(pending):
            name = pending[future]
            try:
                report[name] = future.result()
                failed = isinstance(report[name], dict) and 'error' in report[name]
                print(name + (': FAILED' if failed else ': OK'), flush=True)
            except Exception as error:
                report[name] = {'error': type(error).__name__}
                print(name + ': ' + type(error).__name__, flush=True)
            # Preserve completed checks even if another API call is slow.
            report.setdefault('checkTimes', {})[name] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Report: ' + str(output.relative_to(ROOT)))


if __name__ == '__main__':
    main()
