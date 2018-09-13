---
title: "Tada68 - My 1st qmk keyboard"
date: 2018-09-13T11:57:12+10:00
draft: false
---

__JUST A KEYBOARD?__

For a long time now I have always wanted a keyboard that does not require any special software/driver being installed into PC/Mac but has all the cool programmable macro in its firmware that I could modify. Then I discovered [qmk](https://github.com/qmk/qmk_firmware) 2 months ago! 😱

After doing some researches, mostly looking through [/r/MechanicalKeyboards](https://www.reddit.com/r/MechanicalKeyboards), i decided to take the leap and bought a Tada68 (also called [Saber68](https://www.originativeco.com/) ). Originally I was almost convinced to build my own with a Teensy microcontroller but the amount of time+effort to build the keyboard is absurb and I'm sure i could use that time better elsewhere given that now have 2 kids to look after.🤷‍♂️  

And here it is in all its glory:

![tada68](/static/tada68.jpeg)

I have also tinkered with the layout for a while now and I think i finally got what i need and i would like to share it here if anyone want to try it out.

You can fork/clone my layout [here](https://github.com/santrancisco/qmk_firmware/tree/master/keyboards/tada68/keymaps/santrancisco). 


__MY LAYOUT__

The modifications from the default keymap are:

 - Replaced capslock with a main function key - same as stephengrier (thanks dude)
 - Swapped the left ALT and Win key - similar to MAC

Useful Key sequence modification:

 - (LeftShift + ESC) -> `~`   (Useful for using terminal due to my habit to reference $HOME)
 - (Alt + ESC)       -> `` ` ``  (Not great but it's better than reaching for backtick all the way to right corner)
 - (FN  + ESC)       -> `` ` ``  (Same as above, just another alternative to get a backtick)
 - (Alt + 2)         -> `ALT + F2` (This is useful for *nix machine with GUI to execute apps)
 - (FN + Z)        -> Modify the code where it says "your_half_of_password" with a random complex tring (eg:"G23#fv!!lk" ). This can be used as another half of your password for site you don't really care about and dont want to bother using lastpass or keepass for it 🤷‍♂️
 - (FN +  ENTER)     -> `CAPSLOCK`  (Incase you miss capslock so much or you feel the need to make your point clear in Youtube comment.)
 - (FN  + H)         -> `Home + #` (This is useful when you type a bash command but doesnt want to run it yet, it will comment out the command. Think H for Hash-# )
 - (FN + C) TYPE YOUR MACRO (FN + X) -> Record `TYPE YOUR MACRO` keystrokes
 - (FN + V)        -> Play back the macro you recorded above. Remember, this macro is cleared when the keyboard is unplugged.



Other useful FN layer sequences:

To navigate in IDE without lifting my hand:

 - W,A,S,D -> Up + Down + Left + Right  
 - Q+E     -> Home + End
 - J+L     -> Home + End (Due to my habit of using right hand to navigate Home&End) 

For managing volume, brightness (screen&keyboard back light), printscreen button:

 - M,<,>   -> MUTE, volume down, volume up (Make sense with M stand for Mute)
 - P       -> Print Screen (P for Printscreen)
 - [,],\   -> Keyboard light down, keyboard light up , Toggle breathing mode (I noticed I only need these 3 cause turning off keyboard light just mean repeatedly tapping keyboard light down)
 - I,O     -> Increase/Decrease brightness of Mac screen (mapped to F14 & F15)
 

Many people like to have FN + arrow keys as alternative for mouse but i think if you already move your hand away from where you type, it will be faster to just use the normal mouse or in my case, the apple trackpad anyway.Hence, i'm keeping the rigth shift and almost all function for the navigation keys the same, except for Left and Right when use with FN turn to Home and End button (This is the same as you would expect when use apple laptop keyboard). 

The good thing about keeping the right shift where it is is that when i need to highlight sometext on the screen, i can hit the rigth shift using my pinky together with FN + WASD combo to quickly select text. This takes a bit to get used to but it feels more comfortable than left shift+arrow keys. 


__WHAT'S NEXT?__

So I will soon join a Devsecops team in CampaignMonitor (YAY!). For this gig I will mostly work from office (at least 3 days a week) so it is clearly a good reason to have a dedicated keyboard at work! And for that, i have ordered a DZ60 keyboard (it's a 60% keyboard so a little smaller than TADA68 and missing a few keys ;)) With that said, I rarely move my hand to the right side of the keyboard for arrow keys these days, thanks to the macros, I really wont miss it much ;) 