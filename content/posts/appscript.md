---
title: "Script those mailbox alerts!"
date: 2019-04-04T12:24:37+10:00
draft: false
---

### UPDATE - automatically save to google drive

Update: So I recently found that some of my alerts are quite good at catching password list and i often get 2 or 3 a day and the uploader or pastebin keeps deleting them after a few hours/days. I don't really look at these files but wanted to collect them for future reference (eg building a password list, building a similar service like haveibeenpwn but more instantaneous eg sending emails to users who are affected out of good will), so i rewrite the appscript a little to fetch the file and save it to google drive. This is now working pretty nicely and i can check my google drive every now and then for a freshly download password list.

Hmmm To be honest, It wouldnt be very hard to parse the file and perform simple regex to get the list of email and we can add all of those affected users into a bcc field of email and send it out .... That's tempting !!!


Recently I decided to sign up to pastebin pro. Since pastebin pro only notifies you via email, it is quite inconvenient so I decided to look around for a solution that would let us ship these alerts to Slack.

And i came across [this](https://gist.github.com/andrewmwilson/5cab8367dc63d87d9aa5) little snippet google appscript trick which you can set to run every 5,10 minutes and send everything in your mailbox with "ToSlack" tag on it and untag them so they wont be sent again. 




```javascript

var postUrl = "https://hooks.slack.com/services/XXXXX/XXXXX/XXXXXXXX";
var postChannel = "#yourslackchannel";

// Download the pastebin file and save it to our google drive.
function getFile(fileURL) {
  var response = UrlFetchApp.fetch(fileURL,{muteHttpExceptions: true});
  if (response.getResponseCode() == 404) {
    Logger.log(fileURL+"is deleted");
    return
  }
  var fileBlob = response.getBlob();
  var folders = DriveApp.getFoldersByName('PastebinPasswordList');
  var result = folders.next().createFile(fileBlob);
 // debugger;  // Stop to observe if in debugger if needed to
}


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
        // Poor man way to grab the pastebin id and build the RAW string.
        var uri = message.getPlainBody().split("pastebin.com/")[1].split('\n')[0];
        getFile("https://pastebin.com/raw/"+uri)
   }

   // remove the label from these threads so we don't send them to
   // slack again next time the script is run
   label.removeFromThreads(threads);
}


```

And there it is in action, neat huh? ;)


![gmailtoslack](/static/gmailtoslack.png)