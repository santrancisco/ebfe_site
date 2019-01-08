---
title: "Graphing flowlog"
date: 2019-01-03T20:09:04+11:00
draft: false
---

Recently I completed a small fun side project i wanted to do when i first joined CM. Correction, in fact, this project has been on my mind since the day I started using AWS. I wanted to graph flowlog and make it pretty/useful.

The simplest part of the project using golang aws sdk to download, cache and parse hundred of flowlog gz files using multiple threads. 

The hardest part was to find a cool graph library or an opensource project i could modify that could graph 500+ notes with ease and the graph makes sense. After looking through many existing network log graphing tools I noticed they all have similar design with each node being a dragable bubble with elastic connectors. Some even have some cool grouping algorithm running ontop. I used similar technique in my previous "graph" project - [DRAT](https://github.com/GovAuCSU/DRAT) which i will cover later. :)


Finally, I managed to come up with, i think, a good way to graph and make sense of network log. 

Thanks to David McClure's [humanist app](http://humanist.dclure.org/) app, I was able to realise my vision by making some small modification to his code to make it work with my dataset.

If you are eager to find out what it looks like, You can find an example of my flowlog graphing here [https://sampleflowlog.surge.sh](https://sampleflowlog.surge.sh/). I promise you it looks quite sleek ;)

![example](https://raw.githubusercontent.com/santrancisco/graphflowlog/master/example.png)

I'm sure you are a bit confused as to what so cool about the graph, here is some explanation to help explaining: 

The nodes X and Y coordinates are actually calculated by the golang application at the very end after parsing all flowlog files and gather all information it needs. The golang app calculate the node's X,Y coordinate follow the following rule:

![graph1](/static/graph1.png)

So each collumn is a /24 subnet and using the last octet we can work out the Y coordinate. This way servers in the same subnet (which usually have similar services on them) will be grouped together.

Another feature of the graph that i quite like is the fact that the RGB color code of the nodes are also calculated base off the sum of all open ports on that box. This way we have servers with similar open ports having the same color 🤘.

Unfortunately there are a few quirks and hacks in this project which I havent had time to look into and these are:
 - All "open ports" are determined by simply comparing fromport and toport and choose the lesser value so there maybe some wrong report when the listener is on a very high port
 - The app only graph internal Ip addresses ranges at the moment and drop all other nodes outside of internal network.



You can find the code for both the frontend and my golang app [https://github.com/santrancisco/graphflowlog](https://github.com/santrancisco/graphflowlog)