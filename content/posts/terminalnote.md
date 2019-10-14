---
title: "Bash trick"
date: 2019-10-14T11:57:12+10:00
draft: false
---

__TIRED OF FOGGY BRAIN__

I always have trouble with recalling what command i ran in the past, constantly looking up for simple trick in bash so i have always wanted to build something similar to [cheat.sh](http://cheat.sh/) for myself. Except cheat.sh runs on a python flask server and i really think it is bloated/overengineered for what it does. All i want is a simple static site generator to convert markdown notes to colored console output. 

__FUN .bashrc trick__

So i wrote a simple script today to help myself taking notes of commands i run while i use bash. It's only a few lines and all it does is taking the command you ran with some description and shove it into a terminalnote.md file in your home folder. I will then move these notes later when i have time to specific markdown file/folder.'

The script is simple and shown below.

```bash

export NOTE="$HOME/terminalnotes.md"
function tnote() {
    HISTORY_ENTRIES=`history | tail -n 20`
    echo "Last few entries in your history are:"
    echo "$HISTORY_ENTRIES"  | awk '{ printf "\033[35m" $1 "\033[0m"; $1 = ""; print $0;}'
    echo "---------------------------------"
    echo -e "\033[35mnew\033[0m Type your own command "
    echo -e "\033[35mclip\033[0m Get from clipboard "
    echo ""
    exec 3<>/dev/tty
    while true; do
	read -u 3 -p "Choose command (purple above): " choice
	cmd=""
        if $(echo "$HISTORY_ENTRIES" | grep -q "$choice"); then
           cmd=$(echo "$HISTORY_ENTRIES" | grep "$choice" | sed -e "s/ *[0-9]* *//")
	fi
	
	if [ "$choice" == "new" ]; then
	   read -u 3 -p "Enter custom command: " cmd
	fi
	if [ "$choice" == "clip" ]; then
	   cmd=`xclip -selection clipboard -o`
	fi

	if [ "$cmd" != "" ]; then
            echo -e "\nYou picked: \033[0;34m$cmd\033[0m"
            read -u 3 -p "Enter descriptions: " desc
            echo -e "\n$desc\n" >> $NOTE
            echo '```' >> $NOTE
            echo "$cmd" >> $NOTE
            echo '```' >> $NOTE
            echo -e "Note is appended to \033[0;32m$NOTE\033[0m\n"
            break
        fi
        echo "Pick again"
    done

}

```

Here is the image of what it looks like when it runs. You have a choice between using one of the last 20 command, type in a new one or use existing one in clipboard. I even try with a whole bashscript in clipboard and it worked really well  :) 

![terminal note](/static/terminalnote.png)

__Static site generator__

So i don't have much time to muck around with this and thus i just write this dirty bash script to basically convert all markdown inside `contents` subfolder to a terminal colored file inside a `public` folder while retaining folder structure. The script also generates a simple index.html for simple listing of available cheatsheets. The public folder could then be hosted onto any webserver and available for user to `curl` and get the cheats. Obviously these files when viewed in browser will not look nice but that is beyond the point here.

The folder structure should be:


```bash
#!/bin/bash
##Folder structure should be:
## ____runme.sh
##  |__./contents/hello.md
##  |__./contents/linux/vim.md
##  |__./contents/python/asyncio.md
##  |__./public

## After the code run, we will get public folder look like this:
##  |__./public/index.html
##  |__./public/hello
##  |__./public/linux/vim
##  |__./pugblic/python/asyncio
##
## This is a good template for a bash script with multiple tasks

which consolemd &> /dev/null
[ $? -eq 0 ] || { echo "consolemd does not exist, please run 'pip3 install consolemd'"; exit 1; }


# Bail if there is an error
set -e
# Uncomment line below if you want to see the command being run
# set -x
# Change to the directory of the script
cd "$(dirname "$0")"

# set trap to always call cleanup function whether it fails or not
trap cleanup EXIT
# Note: trap can be used with signal number, eg "trap cleanup 9" will only be called on sigkill 
# Run `trap -l` to know what the list of all signals are.

#cleanup function is called at the end of the script whether it fails or not
function cleanup {
    echo "Fin."
    #echo "[+] cleanup code was called"
}
PUBLICFOLDER='public'

function convertdoc {
    FILENAME=$1
    BASENAME=`basename $FILENAME .md`
    DIRNAME=`dirname $FILENAME`
    DESTINATIONFOLDER=`echo ../$PUBLICFOLDER/$DIRNAME`
    DESTINATIONFILE=`echo $DESTINATIONFOLDER/$BASENAME`
    echo "[+] Converting $FILENAME" 
    mkdir -p $DESTINATIONFOLDER
    cat $FILENAME | consolemd > $DESTINATIONFILE
    echo "$DIRNAME/$BASENAME" |sed 's/^\.\//\//g' >> ../$PUBLICFOLDER/index.html
}

export -f convertdoc

# Try calling this with ./task.sh callme Whatever
function gendoc {
    CONTENTFOLDER='contents'
    cd $CONTENTFOLDER
    echo "" > ../$PUBLICFOLDER/index.html
    echo "[+] Going into folder $CONTENTFOLDER" 
    if [ -z "${FILES:-}" ]; then
        find ./ -name '*.md' -exec bash -c "PUBLICFOLDER=$PUBLICFOLDER convertdoc {}" \;
    fi
    exit 0
}


function help {
   echo "$0 <task> <args>"
   echo "Tasks: "
   compgen -A function | egrep -v 'cleanup|help|convertdoc' |cat -n
}


# execute the function and arguments pass to this script.
# If nothing provided, run help function
set -e
${@:-help}

```


To try it out, you can run `curl https://sancheatsheets.surge.sh` (This is not where i host my official cheatsheets). This is a playground markdown i was messing with to see what the output will look like in the terminal.

__WHAT'S NEXT?__

The codes are ugly and need some clean up but eh.. it works.. i might revisit it later but for now it will do. You can either sync the folder to remote server using rsync in commandline, or build simple CICD trigger with every push to github repository ... 
