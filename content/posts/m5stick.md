---
title: "Helping my son to study remotely with ESP32!"
date: 2021-03-04T09:40:35+10:00
draft: false
---
 
### Problem
 
My son needed to do some remote learning recently to learn Vietnamese. Even though studying over zoom in virtual classroom works really well and he was more focus than when learning 1on1 with me or my wife, I noticed a big problem when all the kids try to show the teacher their writing. The camera quality is bad, the writing is messy and it's hard for the teacher to check their writing. Below you can see the problem.
 
![camera problem](/static/cameraproblem.gif)
 
Another problem my there is no quick way for him to mute himself so he can practice reading when it's other kids' turn to read. 

### Solution
 
Granted this solution is overkill and you can achieve this by running some software to remap laptop keyboard keys to the shortcut combination keys but what's the fun in that? 

Recently I have been teaching my son how to code using m5stack, particularly with the m5core and m5stickc. They are lovely ESP32 devices with a great sensor modules system and super intuitive programming interface (hop over to https://flow.m5stack.com/ if you want to check it out). So knowing it is an ESP32 which i played with a while back to send keystrokes using [ESP32-BLE-Keyboard](https://github.com/T-vK/ESP32-BLE-Keyboard) library, I came up with an idea to make it more fun for him to study. Below is the picture of what i built and some explanation :)

![camera solution](/static/camerasolution.png)

Using 2 buttons on m5stickc, i can easily swap the camera input between the inbuilt webcam and the microsoft webcam by emulating and sending "Alt N" to zoom client. To mute himself in the class, he can press another button which send "Alt A" combination. Here is a gif of it in action. I'm pretty happy with how simple it is to use and another proof to my wife that buying bulk 2kg of lego technic was a good idea!

![camera solution](/static/camerafinal.gif)


And below is the super simple Arduino script using M5stickC and blekeyboard library.


```c
#include <M5StickC.h>
#include <BleKeyboard.h>
BleKeyboard bleKeyboard;
void setup() {
  Serial.begin(115200);
  Serial.println("Starting ...");
  M5.begin();
  bleKeyboard.begin();
}
void loop() {
   M5.update();
  if (bleKeyboard.isConnected()) {
    M5.Lcd.fillScreen(TFT_BLUE);
    if (M5.BtnA.wasPressed()){
        Serial.println("Sending Alt A...");
        bleKeyboard.press(KEY_LEFT_ALT);
        bleKeyboard.print("a");
        bleKeyboard.releaseAll();
    }
     if (M5.BtnB.wasPressed()){
        Serial.println("Sending Alt N...");
        bleKeyboard.press(KEY_LEFT_ALT);
        bleKeyboard.print("n");
        bleKeyboard.releaseAll();
    }
  } else {
    M5.Lcd.fillScreen(TFT_RED); 
  }
  if (M5.BtnB.pressedFor(2000)){
      Serial.println("Restarting ...");
      ESP.restart();
      return;
  }
  delay (50);
}
```