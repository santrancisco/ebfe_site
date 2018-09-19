---
title: "Terraform - cidrsubnet calculation tool"
date: 2018-09-19T15:44:44+10:00
draft: false
---

This tool was hosted at [https://cidr.surge.sh](https://cidr.surge.sh) in the past. It is simple tool i modified from Michel MARIANI's [code](http://www.tonton-pixel.com/). The extra functionality allows me to workout the arguments i need for cidrsubnet function while writting terraform. This function will interpolate the calculated ip range you configure at runtime.

------------------

<div id="post-9581" class="post-9581 page type-page status-publish hentry">

    <h2><span id="cidr-to-ip-range">CIDR to IP Range</span></h2>
    <p>
      <label>CIDR:
        <br>
        <input id="cidr" type="text" size="32" oninput="getIpRange();">&nbsp;&nbsp;Ex.: 192.0.0.1/25</label>
    </p>
    <p>
      <label>IP Range:
        <br>
        <textarea id="ipRangeOutput" cols="32" rows="1" readonly="readonly"></textarea>
      </label>
    </p>
    <h4> Terrafrom : cidrsubnet(iprange, newbits, netnum)</h4>
    <p>
      <label>Terraform newbits:
        <br>
        <input id="tfnewbits" type="text" size="32" oninput="getTerraformIpRange();">&nbsp;&nbsp;Ex.: 2</label>
    </p>
    <p>
      <label>Terraform netnum:
        <br>
        <input id="tfnetnum" type="text" value="0" size="32" oninput="getTerraformIpRange();">&nbsp;&nbsp;Ex.: 2</label>
    </p>
    <p>
      <label>Terraform CIDR List:
        <br>
        <textarea id="tfcidrListOutput" cols="32" rows="1" readonly="readonly"></textarea>
      </label>
    </p>

<hr>


    <h2><span id="ip-range-to-cidr-list">IP Range to CIDR List</span></h2>
    <p>
      <label>IP Range:
        <br>
        <input id="ipRange" type="text" size="32" oninput="getCidrList();">&nbsp;&nbsp;Ex.: 192.168.1.1 - 192.168.1.12</label>
    </p>
    <p>
      <label>CIDR List:
        <br>
        <textarea id="cidrListOutput" cols="32" rows="8" readonly="readonly"></textarea>
      </label>
    </p>
    <p><strong>Notes:</strong>
    </p>
    <ul>
      <li>CIDR stands for <a href="http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing">Classless Inter-Domain Routing</a>.</li>
    </ul>
    <p>
    </p>
    </p>
  </div>
  <!-- .entry-content -->
</div>



<script type="text/javascript">

function int32ToBytes (int32)
{
	return [ (int32 >>> 24) & 0xFF, (int32 >>> 16) & 0xFF, (int32 >>> 8) & 0xFF, (int32 >>> 0) & 0xFF ];
}
function bytesToInt32 (bytes)
{
	return (((((bytes[0] * 256) + bytes[1]) * 256) + bytes[2]) * 256) + bytes[3];
}
function buildMask (size)
{
	return size ? -1 << (32 - size) : 0;
}
function applyMask (ip32, mask)
{
	// Unfortunately, cannot simply use:
	// return ip32 & mask;
	// since JavaScript bitwise operations deal with 32-bit *signed* integers...
	var ipBytes = int32ToBytes (ip32);
	var maskBytes = int32ToBytes (mask);
	var maskedBytes = [ ];
	for (var index = 0; index < ipBytes.length; index++)
	{
		maskedBytes.push (ipBytes[index] & maskBytes[index]);
	}
	return bytesToInt32 (maskedBytes);
}
function ip32ToIp (ip32)
{
	var ip = false;
	if ((typeof ip32 === 'number') && isFinite (ip32))
	{
		ip = int32ToBytes (ip32 & 0xFFFFFFFF).join ('.');
	}
	return ip;
}
function ipToIp32 (ip)
{
	var ip32 = false;
	if (typeof ip === 'string')
	{
		var matches = ip.match (/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
		if (matches)
		{
			var ipBytes = [ ];
			for (var index = 1; index < matches.length; index++)
			{
				var ipByte = parseInt (matches[index]);
				if ((ipByte >= 0) && (ipByte <= 255))
				{
					ipBytes.push (ipByte);
				}
			}
			if (ipBytes.length === 4)
			{
				ip32 = bytesToInt32 (ipBytes);
			}
		}
	}
	return ip32;
}
function cidrToIps (cidr)
{
	var ips = false;
	if (typeof cidr === 'string')
	{
		var matches = cidr.match (/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
		if (matches)
		{
			var ip32 = ipToIp32 (matches[1]);
			var prefixSize = parseInt (matches[2]);
			if ((typeof ip32 === 'number') && (prefixSize >= 0) && (prefixSize <= 32))
			{
				var mask = buildMask (prefixSize);
				var start = applyMask (ip32, mask);
				ips = [ ip32ToIp (start), ip32ToIp (start - mask - 1) ];
			}
		}
	}
	return ips;
}
function ipRangeToIps (ipRange)
{
	var ips = false;
	if (typeof ipRange === 'string')
	{
		var matches = ipRange.match (/^(\d+\.\d+\.\d+\.\d+)\s*[,;:\-]\s*(\d+\.\d+\.\d+\.\d+)$/);
		if (matches)
		{
			ips = [ matches[1], matches[2] ];
		}
	}
	return ips;
}
function maxBlock (ip32)
{
	var block = 32;
	while (block > 0)
	{
		if ((ip32 >>> (32 - block)) & 0x00000001)
		{
			break;
		}
		else
		{
			block--;
		}
	}
	return block;
}
function ipsToCidrs (firstIp, lastIp)
{
	var cidrs = false;
	if ((typeof firstIp === 'string') && (typeof lastIp === 'string'))
	{
		var firstIp32 = ipToIp32 (firstIp);
		var lastIp32 = ipToIp32 (lastIp);
		if (firstIp32 <= lastIp32)
		{
			cidrs = [ ];
			while (lastIp32 >= firstIp32)
			{
				var maxSize = maxBlock (firstIp32);
				var maxDiff = 32 - Math.floor (Math.log (lastIp32 - firstIp32 + 1) / Math.log (2));
				var size = Math.max (maxSize, maxDiff);
				cidrs.push (ip32ToIp (firstIp32) + "/" + size);
				firstIp32 += Math.pow (2, (32 - size));
			}
		}
	}
	return cidrs;
}
function ipRangeToCidrs (ipRange)
{
	var cidrs = false;
	var ips = ipRangeToIps (ipRange);
	if (ips)
	{
		cidrs = ipsToCidrs (ips[0], ips[1]);
	}
	return cidrs;
}

</script>

<script type="text/javascript">
function $(i) {
    return document.getElementById(i);
}
    // San dodgy code to calculate terraform ip ranges
function getTerraformIpRange() {
    if ($("ipRangeOutput").value == "") {return}
          // if we had valid original cidr, move on

    originalcidr=$('cidr').value.trim();
    startip = cidrToIps(originalcidr)[0]
    endip = cidrToIps(originalcidr)[1]
    orgmask = parseInt(originalcidr.split('/')[1])

    newbits = parseInt($('tfnewbits').value.trim())
    netnum = parseInt($('tfnetnum').value.trim())
    newmask = orgmask+newbits
    if (newmask > 32 || $('tfnetnum').value == "") {return}
    mask = Math.abs(buildMask(newmask))
    startip32 = ipToIp32(startip)
    ips = [ ip32ToIp (startip32 + mask*netnum), ip32ToIp (startip32 + mask*(netnum+1) - 1) ];
            console.log(ipToIp32(endip))
            console.log(startip32 + mask*(netnum+1) - 1)
            if (ipToIp32(endip) < (startip32 + mask*(netnum+1) - 1)){
                $('tfcidrListOutput').value = "You went over specified ip range."; 
                return;
            }
    $('tfcidrListOutput').value = ips ? ips.join(' - ') : "";

}

function getIpRange() {
    var ips = cidrToIps($('cidr').value.trim());
    $('ipRangeOutput').value = ips ? ips.join(' - ') : "";
}

function getCidrList() {
    var cidrs = ipRangeToCidrs($('ipRange').value.trim());
    $('cidrListOutput').value = cidrs ? cidrs.join('\n') : "";
}
</script>