---
title: "Gnome extension - Argos"
date: 2019-11-18T19:57:12+10:00
draft: false
---

So just recently I got back on the Nix bandwagon and it has been an extremely smooth/enjoyable ride thanks to my trusty Galago Pro and the awesome PopOS that comes with it! ;)

With that said, there are a few things I miss when i was using MacOSX and one of those is the awesome BitBar app! Then comes along [Argos](https://github.com/p-e-w/argos). This gnome extension project does exactly what i want and I have since created a couple of task menus with it to help with my day to day.

Argos, however, is a bit tricky when it comes to complex tasks or when you just want to run a bash function.  Here is a simple template I made to help addressing it. The taskmenu helps to encode & decode string and save it straight into clipboard using xclip. Using zenity, we can prompt user for text input. Our code check if the text input is empty, in which case, it would use the content of our clipboard to encode/decode.

![Imgur](https://i.imgur.com/F6dlOFG.png)

The main purpose of this code is to demonstrate a clean way to write argos interactive menu to trigger function in the same argos.sh file. Use it at your own risk :p

```bash
#!/bin/bash
set -e
function pbcopy {
        xclip -selection clipboard $1
}
function pbpaste {
        xclip -selection clipboard -o
}
function urldecode {
    python -c "import sys, urllib as ul; print ul.unquote_plus(sys.argv[1])" "$1"
}
function urlencode {
    python -c "import sys, urllib as ul; print ul.quote_plus(sys.argv[1])" "$1"
}
function promptencodetocopy {
    export TEXT=`zenity --entry --title="Text to encode"`
    if [ "$TEXT"="" ]; then
        export TEXT=`pbpaste`
    fi
    urlencode "$TEXT" | pbcopy
}
function promptdecodetocopy {
    export TEXT=`zenity --entry --title="Text to decode"`
    if [ "$TEXT"="" ]; then
        export TEXT=`pbpaste`
    fi

    urldecode "$TEXT" | pbcopy
}

## Display menu if there is no argument note the way we call our function is to call this very script ($0) with name of the function.
if [ $# -eq 0 ]; then

        echo "conversio"
        echo "---"
        echo "URLEncode | iconName=gedit bash='$0 promptencodetocopy' terminal=false"
        echo "URLDecode | iconName=gedit bash='$0 promptdecodetocopy' terminal=false"
        exit 0
else
## If there is argument to the script just run whatever function you want to call and all its arguments.
        $@
fi

```

I have also updated the wiki for the project so others can check it out and build their own.