---
title: "Android 8 root & cert"
date: 2019-10-16T20:15:45+10:00
draft: false
---

Recently i want to mess with some phone traffic so i took out my broken screen Pixel phone and decided to wipe it and use it for testing. After downloading the latest android 10 factory build and flash it to the phone via fastboot, It became apparent that the community hasn't spent much time modding it and mounting /system as RW is still very alpha or doesnt work at all. This is due to some re-architect that google does for their partition. You can read it [here](https://source.android.com/devices/bootloader/system-as-root) if you want.

So I have a problem. Previously i only need to drop my burp cert into `/system/etc/security/cacerts` folder and after configurting wifi proxy setting, my burp screen will just light up with connections for applications but now that is not possible. If i do drop my cert into user trust store, I will need apktool to repackage the app and add/modify `res\xml\network_security_config.xml` to allow the app to trust user cert. 

So now I am left with either i learn to compile/build Android from scratch and put system.img together or downgrade. Since my friends did have a good point that since this is just a testing phone, i don't really need the latest android and debugging/messing with app in earlier android version is much easier so downgrade is the way to go. 

So now i'm documenting these steps incase I need to redo all these in the future

## Flash with stock android

 - After unlock the bootloader, turn off the phone, turn on while holding down volume down.
 - Download android 8.1 Factory Image [here](https://developers.google.com/android/images) for marlin (Pixel XL)
 - unzip the file and with cable plugged in run `flash-all.sh` script.

## Install Magik
 
 - Download latest [Magisk](https://github.com/topjohnwu/Magisk/releases) zip file
 - Download [TWRP](https://twrp.me/google/googlepixelxl.html) for marlin (Pixel XL) img file (eg twrp-3.3.1-2-marlin.img)
 - Reboot to bootloader 
 - Run `fastboot boot twrp-3.3.1-2-marlin.img` to boot into twrp image
 - Run `adb push Magisk-v20.0.zip /` to push Magisk installation file over
 - Navigate twrp to install Magisk
 
Done... we now have Magisk install which allow us to gain root/superuser mode 

## Burp cert

The problem with Burp issued cert I had was the expiry date set for too long and Android browser refuses to accept it. We can generate the cert by ourselve and import it into burp:

```bash
openssl req -x509 -nodes -days 700 -newkey rsa:2048 -keyout pk.key -out cert.crt
openssl pkcs12 -export -out certkey.p12 -inkey pk.key -certfile cert.crt -in cert.crt
```

We now have certkey.p12 to import into burp.

We run the following to know the hash of the filename we need for Android system ca store

``` bash
openssl x509 -inform PEM -subject_hash_old -in cert.crt | head -1

## We then rename cert pem file to the right name convention

mv cert.crt <hash>.0
```

Finally, we copy the certificate over to `/system/etc/security/cacerts` by pushing it over adb, escalate to root, remount `/` and move the cert file.

```bash
adb push <hash>.0
adb shell
su 
mount -o remount,rw /dev/root
mv /<hash>.0 /system/etc/security/cacerts
```

Run `adb reboot` or restart the phone and check the system certificate store to make sure our new cert is installed. 