---
title: "How not to run a CTF."
date: 2019-03-09T13:50:35+10:00
draft: false
---

For #cmdevcamp19 our security team decided to host a Jeopardy style Capture The Flag challenge for all the developers. This round of CTF did not run as smoothly as we hoped for and there are a lot of improvements need to be made for the next time.

### Problem 1 : Flag is inconsistent, not ready or required last minute changes

The CTF is built to raise awareness about security at Cammpaign Monitor(CM) so for the main challenges, we decided to tweak the internal dev environment - revert some of the fixes and disable some security flags. This will showcase the previous vulnerabilities that our application was exposed to and how the problem was introduced. In one particular challenge, as it turn out, it was not possible to remove the protection unless we redeploy the applicaiton and that is never a good idea right before the CTF. 

Due to some inconsistency in our dev build envrionment (as you would expect when people play with things in dev and have different versions of the code running or different server build, etc), a flag ended up to be different everytime you try to exploit the app 🤦‍♂️.

One of my question required me to change one of my DNS entry, i was so sure i did it before the CTF through terraform+route53 but perhaps i forgot to apply the change and the TTL was 3600 for it :( 

So the lesson learn here is to double check. tripple check your flags the day before you go live because your environment or your setup may have changed during the time between you introduced the question to the list and the time CTF takes place.

### Problem 2: Devops is hard

In true devops/infra coder style, i decided to run the [facebook ctf platform ](https://github.com/facebook/fbctf) in Fargate so we can scale it as we need. I originally wanted to run it off a vagrant VM in my Macbook pro but decided last minute that i will move it to AWS. After looking around for options, i decided to modify the existing startup script for fbctf to decouple the mysql server component out so i could use an RDS instance for it instead. I left the rest of the startup script untouched and this is where everything went wrong.


So 4 days before the ctf, i finally got my version of fbctf docker image push to docker hub + a terraform code to do the hard work :

 - Create VPC, private & public subnets + internet gateway + security groups 
 - A Mysql database to store the game progress
 - An ALB and target group for the ECS service
 - Create a fargate cluster + task definition for fbctf + ecs service to run my version of fbctf

This is where shit hits the fan... I ignored one important piece of components in FBCTF setup - the memcached. ☹️ I started the ecs service with 1 node after hours of work to get everything working and seeing the ALB works, the ACM issued cert, the DB initialised and everything worked, i was delighted and moved on.

In the actual CTF, At first we thought the slow hotel wifi was killing our connection as it did for the last few days staying here, but not only that, i did not provide enough resource to the container and it was struggling 🤦‍♂️. I decided it is time to scale horizontally and increase the number of containers in ECS service! This will have zero downtime ;) ... But since fbctf php app use memcache to store session data and sync up with other nodes instead of having session data in mysql db for example (which makes sense in term of speed and less database IO), we now have memcaches not being in sync and users request end up hitting servers that did not know users already login and kick them out etc... it was a mess

When i finally realised what happened... I resized fargate to 1 instance with twice the CPU and memory but this was still struggling.

In all honesty, i wish i tested this out better and RTFM haha.. but I'm glad that despite all of that, the energy in the room was great, the top team managed to solved all answers except 1 and there were a lot of security discussion afterward (as well as devops questions). 

Here is the final map of the ctf look like with most of flags being captured by team dragon ;)

![finalmap](/static/finalmap.png)


And here is the final score graph. People were really into it and the average score is high.

![finalmap](/static/finalscore.png)

At the end of the day, this was built for people to learn about security and best practices so we gave as much clues as we can and help teams out when they need. 

#cmdevcamp19 