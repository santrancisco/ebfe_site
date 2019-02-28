---
title: "Script those mailbox alerts!"
date: 2019-01-27T12:24:37+10:00
draft: false
---

Recently I decided to sign up to pastebin pro. Since pastebin pro only notifies you via email, it is quite inconvenient so I decided to look around for a solution that would let us ship these alerts to Slack.

And i came across [this](https://gist.github.com/andrewmwilson/5cab8367dc63d87d9aa5) little snippet google appscript trick which you can set to run every 5,10 minutes and send everything in your mailbox with "ToSlack" tag on it and untag them so they wont be sent again. 


```javascript

var postUrl = "https://hooks.slack.com/services/XXXXX/XXXXX/XXXXXXXX";
var postChannel = "#yourslackchannel";
  


function sendEmailsToSlack() {
    var label = GmailApp.getUserLabelByName('ToSlack');
    var messages = [];
    var threads = label.getThreads();
  
    for (var i = 0; i < threads.length; i++) {
        messages = messages.concat(threads[i].getMessages())
    }

    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        Logger.log(message);

        var output = '*New Email Alert*';
        output += '\n*subject:* ' + message.getSubject();
        output += '\n*body:* ' + message.getPlainBody();
        Logger.log(output);

        var payload = {
            'username': 'gmail-bot',
            'text': output,
            'channel' : postChannel,
            'icon_emoji': ':hear_no_evil:',
        };

        var options = {
            'method' : 'post',
            'payload' : Utilities.jsonStringify(payload),
        };

        // replace this with your own Slack webhook URL
        // https://crowdscores.slack.com/services
        var webhookUrl = postUrl;
        UrlFetchApp.fetch(webhookUrl, options);
   }

   // remove the label from these threads so we don't send them to
   // slack again next time the script is run
   label.removeFromThreads(threads);
}

```

And there it is in action, neat huh? ;)


![gmailtoslack](/static/gmailtoslack.png)