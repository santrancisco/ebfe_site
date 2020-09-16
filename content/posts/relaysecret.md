---
title: "Building minimal viable encrypted file sharing"
date: 2020-09-16T22:40:12+10:00
draft: false
---

## Why another file sharing tool?

Firefox send project was recently suspended due to malware abused. This sucks big time as I was literrally trying to advocate about it at work and that we could do better at file sharing on the very same day and was greeted with "Firefox send is down" message when trying to showcase it.

I then spent that night looking into writing a terraform code to deploy firefox send in AWS... There were quite a few pieces.. a server or container running the nodejs server, a redis queue and s3 bucket for storage ... Since i also want to run it for personal use, i could not justify the redis queue cost and the whole complex nodejs backend make management a pain.

Fast forward to earlier this week, i had some free time and decided to build something by myself and thus [relaysecret](https://www.relaysecret.com/) was born. You can find the code [here](https://github.com/santrancisco/relaysecret).


## Requirements

Hese are the things i know I wanted from the tool:

- Encryption all done in browser, no 3rd party script should be included.
- No plaintext or password/key should ever go back to server
- File should be automatically removed after certain date
- Low cost
- Minimal backend code = less maintainance.

## Backend code = 1 lambda function

The entire backend code for this project is [this](https://github.com/santrancisco/relaysecret/blob/master/backend/code/lambda.py) one python script running in lambda behind an APIGateway. The libraries used in this code are standard lib for 3.8 lambda runtime so there is no need to add extra libraries. This code does the following jobs:
 
 - Generate presigned POST request for our frontend code to upload encrypted data blob. By using the [POST policy](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html) we can limit the file size, pre-determine the name of the encrypted S3 objects (which is important for clean up later)
 - Generate presigned GET request for our frontend code to download the encrypted S3 objects
 - Delete objects when requested by the frontend code.
 - Perform Virus total check on sha1 of the decrypted data (upon decrypting the S3 object in browser, we calculate SHA1 hash in browser and send this hash back to our lambda function for virustotal scan)

## Backend infrastructure = 1 S3 bucket

S3 is cheap for storage and everything is done straight to our private S3 bucket from uploading to downloading encrypted data via presigned URLs. Our S3 bucket has a special lifecycle rule that would expire objects base on their prefix. For example, object starts with `1day/` will expire exactly after 1 day and get clean up automatically. This effectively removed the piece of code that would, otherwise, needed to clean up the files.

## Frontend code = HTML + Dropin CSS + Vanilla JS.

Everyone is using vuejs, reactjs etc. Personally, i don't like complicating things. I knew this frontend would be dead simple and I wanted something that could be audited easily with minimum effort. I came across [this](https://github.com/meixler/web-browser-based-file-encryption-decryption/blob/master/web-browser-based-file-encryption-decryption.html) project and it was exactly what i needed. After some tweaking to wire it up to our backend code as well as trying out some [drop-in css](https://github.com/dohliam/dropin-minimal-css) to make it pretty.. I'm quite happy with the result.  Below is the screenshot of the app.

![relaysecret](/static/relaysecret.png)

## Deployment code

The deployment code was very simple to write in terraform. A lambda with API Gateway and a lock down S3 bucket. The frontend code is hosted on github page by pushing frontend subtree to its own gh-page branch.

## Conclusion

It was a fun little project and I'm glad i get to learn a few tricks with S3 bucket.
