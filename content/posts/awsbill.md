---
title: "AWSBill < 10$"
date: 2019-03-02T00:50:35+10:00
draft: false
---

So if you followed me from previous blog to this new blog, you know that this blog is served using cloudfront + s3 bucket and every now and then, when i commit new post to master for the blog, like i'm doing now, a webhook fires from github to a lambda function sits behind an AWS API Gateway. This lambda function then download the latest version of the blog, do a hugo build and deploy it to the S3 bucket. 

I also use Route53 to manage about 4 or 5 of my domains. Hurricane Electric is another DNS provider that i use and sometimes i prefer HE because they arent very petty about what i put in my record 😙.

That said, for any experiment i do with AWS, I have always been trying to keep its cost less than 10$ and i even set a billing alarm for 10$! Usually it is around 3$ and the most i ever paid was 12$ when I spent 2 weeks studying for my AWS exam. 

However, recently i have noticed the bill from aws is averaging about 8$! I have been using it every now and then to work on a few projects and today i am planning to work on another exciting one which i hope i can share with you later when i finish. I looked at the bill and there it was... a F***** Elastic IP i forgot to clean up which costs me 3.34$ (i'm not even attaching it to anything) and 2 KMS key i created to learn about KMS which cost 1$ each per month 😱 

So lesson learn: After any studying or experimentations, Keep looking at your bill for the next month, break it down and find anything that stands out... dont be lazy or you will throw 5$ out of the windows every month like me!

![awsbill](/static/awsbill.png)

Ok Time to get back to my project after my rant :D 

Peace out!