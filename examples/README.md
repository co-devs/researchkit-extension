# Examples

This document lists examples of useful lookups and CyberChef recipes.  The folder also contains a [`.json` configuration file](researchkit_examples.json) with all of the below that can be imported to the extension.

## Lookups

| Name | Link | Description|
| ---- | ---- | ---------- |
| VirusTotal | `https://www.virustotal.com/#/search/{placeholder}` | Search VirusTotal |
| Shodan | `https://www.shodan.io/search?query={placeholder}` | Search Shodan |
| Strontic COM | `https://strontic.github.io/xcyclopedia/library/clsid_{placeholder}.html` | Lookup COM Object CLSID |
| Twitter | `https://twitter.com/search?q={placeholder}` | Search Twitter |
| ExplainShell | `https://explainshell.com/explain?cmd={placeholder}` | Help text for shell command |
| Translate | `https://translate.google.com/?sl=auto&tl=en&text={placeholder}&op=translate` | Translate to English |
| Greynoise IP | `https://viz.greynoise.io/ip/{placeholder}` | Search Greynoise |
| IPQS IP | `https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/{placeholder}` | IP addressProxy / VPN lookup |
| OTX Domain | `https://otx.alienvault.com/indicator/domain/{placeholder}` | Search AlienVault Open Threat Exchange for domain |
| MalwareBazaar SHA256 | `https://bazaar.abuse.ch/browse.php?search=sha256%3A{placeholder}` | Search MalwareBazaar for SHA256 hash |
| Chrome Extension ID | `https://chrome.google.com/webstore/detail/{placeholder}` | Search Chrome Web Store for Extension ID |
| DomainTools | `https://whois.domaintools.com/{placeholder}` | Look up DNS info |
| URLScan | `https://urlscan.io/search/#{placeholder}` | Search URLScan |
| Security Event Log ID | `https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid={placeholder}` | Search for Windows Security Event Log ID |

## Recipes

*Dozens of useful recipes available [here](https://github.com/mattnotmax/cyberchef-recipes).*

| Name | Recipe | Description|
| ---- | ------ | ---------- |
| From Hex | `From_Hex('Auto')` | Convert from Hex |
| From b64 UTF16LE | `From_Base64('A-Za-z0-9%2B/%3D',true,false)Decode_text('UTF-16LE%20(1200)')` | Convert from Base64 and UTF-16 Little-Endian |
| URL Decode | `URL_Decode()` | Convert URL percent-encoded characters back to their normal values |
| Cobalt Strike | `Conditional_Jump('bxor',false,'Decode_Shellcode',10)Label('Decode_beacon')From_Base64('A-Za-z0-9%2B/%3D',true,false)Decode_text('UTF-16LE%20(1200)')Regular_expression('User%20defined','%5Ba-zA-Z0-9%2B/%3D%5D%7B30,%7D',true,true,false,false,false,false,'List%20matches')From_Base64('A-Za-z0-9%2B/%3D',true,false)Gunzip()Label('Decode_Shellcode')Regular_expression('User%20defined','%5Ba-zA-Z0-9%2B/%3D%5D%7B30,%7D',true,true,false,false,false,false,'List%20matches')From_Base64('A-Za-z0-9%2B/%3D',true,false)XOR(%7B'option':'Decimal','string':'35'%7D,'Standard',false)` | Parse out shell code from standard B64 Cobalt Strike Beacon |
| Defang URL/IP | `Defang_IP_Addresses()Defang_URL(true,true,true,'Valid%20domains%20and%20full%20URLs')` | Defang URLs and IP addresses |
