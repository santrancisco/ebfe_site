//------------------------------------------------------------------------------
// File: cidr.js
// Copyright: © 2015 Michel MARIANI <http://www.tonton-pixel.com/blog/>
// Licence: GPL <http://www.gnu.org/licenses/gpl.html>
//------------------------------------------------------------------------------
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//------------------------------------------------------------------------------
//
// <http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing>
//
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