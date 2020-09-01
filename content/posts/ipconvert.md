---
title: "IP conversion tricks"
date: 2020-04-30T15:26:28+10:00
draft: false
---

Occasionally I need to bypass some dodgy filter to perform Server Side Request Forgery (SSRF). This could be useful in these instances. Example below is how you may be able to use this trick to bypass filters for the "magic cloud url" to get metadata of the server. Try `curl http://2852039166/latest` on an ec2 instance and see for yourself.

And yes, in case you have not tried, you can even mix them up and shorten it by ignore 0, eg try `ping 192.0x2a.012` will ping 191.42.0.10 ip address :)

Note: For a more elaborate tool, [XIP](https://github.com/immunIT/XIP) can do a lot more transformations.


<form name="base">
<table>
<tr>
<td><strong>IPv4 Dec</strong></td>
<td><input type="text" name="dotd" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="169.254.169.254" onChange="evalDot(this)" autofocus></td>
</tr>

<tr>
<td><strong>Dotted Hex</strong></td>
<td><input type="text" name="doth" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="" onChange="evalDotHex(this)"></td></tr>

<tr>
<td><strong>Dotted Octal</strong></td>
<td><input type="text" name="doto" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="" onChange="evalDotOct(this)"></td>
</tr>
<tr>
<td><strong>Hexadecimal</strong></td>
<td><input type="text" name="h16" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="" onChange="evalNumber(this, 16)"></td>
</tr>
<tr>
<td><strong>Decimal</strong></td>
<td><input type="text" name="d10" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="" onChange="evalNumber(this, 10)"></td>
</tr>
<tr>
<td><strong>Octal</strong></td>
<td><input type="text" name="o8" style="font-family: Verdana; font-weight: bold; font-size: 12px; background-color: lightgreen;width:100%" value="" onChange="evalNumber(this, 8)"></td>
</tr>

</table>
</form>



<script type="text/javascript">
var hex = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F");
function checkInt(n, r) {
  for (var i = 0; i < n.length; ++i)
    if (n.charAt(i) >= r) {
      alert("Invalid digit");
      return 0;
    }
    if (isNaN(M = parseInt(n, r)))
      alert ("Invalid number");
    return M;
}
function decimaltoAnother(A, radix) {
  s = "";
  while (A >= radix) {
    s += hex[A % radix];
    A = Math.floor(A / radix);
  }
  return transpose(s += hex[A]);
}
function transpose(s) {
  N = s.length;
  for (i = 0,t = ""; i < N; i++)
    t += s.substring(N-i-1, N-i);
  return t;
}
function num2dot(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) { 
    num = Math.floor(num / 256);
    d = num % 256 + '.' + d;
  }
  return d;
}
function num2dotHex(num) {
  var d = decimaltoAnother(num % 256, 16);
  d = fixHex(d);
  for (var i = 3; i > 0; i--) { 
    num = Math.floor(num / 256);
    tmp = decimaltoAnother(num % 256, 16);
    tmp = fixHex(tmp);
    d = tmp + '.' + d;
  }
  return d;
}
function fixHex(num) {
  if (num.length == 1)
    return "0x0" + num;
  else if (num.length == 2)
    return "0x" + num;
}
function num2dotOct(num) {
  var d = decimaltoAnother(num % 256, 8);
  d = fixOct(d);
  for (var i = 3; i > 0; i--) { 
    num = Math.floor(num / 256);
    tmp= decimaltoAnother(num % 256, 8);
    tmp = fixOct(tmp);
    d =  tmp + '.' + d;
  }
  return d;
}
function fixOct(num) {
  if (num.length == 1)
    return "000" + num;
  else if (num.length == 2)
    return "00" + num;
  else if (num.length == 3)
    return "0" + num;
}
function dot2num(dot) {
  var d = dot.split('.');
  return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}
function evalNumber(item, r) {
  n = checkInt(item.value, r);
  n = decimaltoAnother(n, 10) % 4294967296;
  base.d10.value = n;
  base.o8.value = "0" + decimaltoAnother(n, 8);
  base.h16.value = "0x" + decimaltoAnother(n, 16);
  base.dotd.value = num2dot(base.d10.value);
  base.doth.value = num2dotHex(base.d10.value);
  base.doto.value = num2dotOct(base.d10.value);
}
function evalDot(item) {
  n = dot2num(item.value);
  base.d10.value = n;
  base.doto.value = num2dotOct(n);
  base.doth.value = num2dotHex(n);
  base.o8.value = "0" + decimaltoAnother(n, 8);
  base.h16.value = "0x" + decimaltoAnother(n, 16);
}
function evalDotOct(item) {
  d = item.value.split('.');
  tmp = checkInt(d[0], 8);
  n = decimaltoAnother(tmp, 10);
  for (var i = 1; i <= 3; i++) {
    tmp = checkInt(d[i], 8);
    n += "." + decimaltoAnother(tmp, 10);
  }
  base.dotd.value = n;
  evalDot(base.dotd);
}
function evalDotHex(item) {
  d = item.value.split('.');
  tmp = checkInt(d[0], 16);
  n = decimaltoAnother(tmp, 10);
  for (var i = 1; i <= 3; i++) {
    tmp = checkInt(d[i], 16);
    n += "." + decimaltoAnother(tmp, 10);
  }
  base.dotd.value = n;
  evalDot(base.dotd);
}
evalDot(base.dotd)
</script>


__April 2020 Update__: Thought i would quickly update this post since i have been dealing with a few SSRF issues :)


Another things to consider: Protocol smuggling

An interesting endpoint for aws beside metadata endpoint is [lambda runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html). Usually at http://127.0.0.1:9001/2018-06-01/runtime/invocation/next

Other potential bypasses: 
  - Simple A record
  - A record with multiple ip addresses listed
  - IPV6
  - 3xx redirect
  - DNSRebinding
  - With the rise of chromeheadless, we can now try redirecting it using meta-refresh or javascript

```
<meta http-equiv="refresh" content="0;url=http://169.254.169.254/latest" />
<script>
  window.location.replace("http://169.254.169.254");
</script>
```
  - With chromeheadless we can also mess with URL like `http://example.com@169.254.169.254/latest/
