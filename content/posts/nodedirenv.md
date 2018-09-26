---
title: "Manage multiple Nodejs versions with direnv"
date: 2018-09-26T23:29:11+10:00
draft: false
---

So recently I need to install nodejs onto my new macbook pro for work and to be honest, i hate having to deal with differetn version of nodejs for different project so i decided to take a different route this time to manage nodejs with direnv. So obviously the requirement is that you need to get [direnv](https://github.com/direnv/direnv/) installed on your laptop first. You can do that in MacOsX with homebrew. 

First we create ~/nodejs folder and check out the list of versions of nodejs (it's fucking huge)

```
mkdir ~/nodejs
cd ~/nodejs
curl -s http://nodejs.org/dist/index.tab | awk '/^v[0-9]/{ print $1 }' | less
```

After you picked the version for nodejs, let's say it's v10.11.0, run the following commands to download and unpack nodejs and create .envrc for that particular nodejs environment.

```
export nodeversion=v10.11.0
mkdir node-$nodeversion
curl -fsSL http://nodejs.org/dist/$nodeversion/node-$nodeversion-darwin-x64.tar.gz |  tar xvz --strip 1 -C node-$nodeversion
echo export PATH=\"$(pwd)/node-$nodeversion/bin:\$PATH\" > node-$nodeversion/.envrc

```

Now you can `cd` into your node-$nodeversion folder, runs `direnv allow` and that is it. Everytime you go to this folder, your nodejs version will be loaded accordingly.

I like that now nodejs will sit in that folder and won't spam my system with all of its dependencies and various versioning problems.