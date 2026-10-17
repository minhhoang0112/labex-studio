import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')
url = 'https://raw.githubusercontent.com/labex-labs/quick-start-with-linux/master/README.md'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8')
print(content)

