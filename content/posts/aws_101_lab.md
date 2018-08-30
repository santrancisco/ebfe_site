---
title: "AWS 101 Network lab"
date: 2018-08-24T20:14:55+10:00
draft: false
---

This lab is kinda like a Helloworld for AWS networking. It walks you through creating a VPC from ground up and walk you through why things arent working (yet).

### Intro ###

How to follow this lab:

_These are questions that would help guide your thought process through out the lab as to why things do not work_

 - These 
 - are
 - the steps to follow :)

__NOTE:__ Interesting facts or reminder will be in here

### Plumbing ###

 - Create a VPC 
 - Create 2 subnets, one for private and another for public
 - For public subnet, Use `Modify auto-assign IP settings` to enable auto-assign public IPv4
 
#### Provision ###

Let's create 2 ec2 instances now

 - 1 in public subnet  
   - Make sure to check that public ip will be given in the launch wizard
   - When prompted, create a new security group or just use the default which allow port __22__ to access from any ip.
 - 1 in private subnet

_Can we ssh to the ec2 in public subnet which has public ip assigned to it yet?_

__NO__! Every new VPC cannot talk to the internet. We need an `Internet gateway` attach to it

  - Create a new Internet gateway and attach it to right VPC

#### Routing ###

_Does ssh to ec2 in public subnet work now?_

__NO__! The internet gateway is attached to the VPC but the route table has not been modifed!
 
  - Add `0.0.0.0/0 to Internet gateway` route to the main routetable, created by default when VPC is created.
  
__NOTE__: DO NOT do this in your actualy work environment, See the Thoughts section below for further explanation after you finish the lab.
  
_Does ssh to ec2 in public subnet work now?_

__YES__! VPC has Internet gateway to reach out, our default internet route is in place, our default security group on the EC2 instances are allowing us IN!

_Does `curl http://google.com` works on the public EC2 ?_

__YES__! The Security Group we created during Provision section above, by default (and you can't change this at creation due to GUI limitation but can edit later), will allow all outbound traffic! 

#### Security Group ###
You can skip this or `apt-get install apache2` to play with this

_Does http traffic work now if you have apache runs on the public box?_ 

__NO__, not yet! Our request probably hits the machine but it is dropped due to our strict Security Group

 - Create a security group that allow all incoming on port __80,443__ 
  __NOTE__: Click the outbound rule tab, notice that by default, Security group allows all outgoing traffic unless specified.
 - Attach this rule to the public EC2 machine
 
_Can we access port 80 & 443 now?_

__YES__! 👍


#### NAT GATEWAY ###

 - ssh to Private EC2 from Public EC2

_Can you ping back the Public EC2 machine (check established conn with `netstat -tp`)?_ 

__YES__!

_Can you ping 8.8.8.8 from Private EC2?_

__NO__! By default, all new subnets are added to the `main` route table. This route table is now having just 2 routes, one to the local ip range and the other is default route (0.0.0.0/0) to the Internet Gateway. However, To receive and send packet via internet gateway, an EC2s needs a `Public IP`. Public IP is provisioned by default to machines launched in our public subnet only because of Modify auto-assign IP settings configuration we set above.

__NOTE__: Right now, even though we call it a "private" subnet, the settings are completely the same for the private and public subnet. They have the same route table (the main route table created along with the VPC), and thus, its default route route is also pointing to our Internet Gateway. If someone creates an elastic public IP and attach it to the private EC2, it will be accessible from the internet.

Let's do proper thing and get these machines in private subnet to talk to the internet securely!

 - Create a NAT Gateway, you will be asked to put it in a public subnet AND request a new Elastic IP address on the internet.
 - Create a new route table (we can't use the main route table because it is associating with Internet Gateway)
 - Add default route (0.0.0.0/0) to point to the NAT gateway we just created.

__NOTE__: NAT Gateway is installed on where the AZ of the public subnet sits. You can share nat gateway across AZ but it's proned to single failure that may bring down the environment.

_Can we now ping 8.8.8.8 from the Private EC2?_

__NO__! Because you have not associate the Route table to any of the private subnet YET!

 - Force association between the new private ip table AND the private subnets

_Can we now ping 8.8.8.8 from the Private EC2?_
__YES__! 



#### Thoughts ###

Now we know that route table `main` is a catch all for all subnets, perhaps, it should be left alone and never be used. That way, every new subnet being created, it wont be connected to the internet immediately until specified which route table it should be associate with.

Always check outbound rules on security groups.. you may allow traffics that you don't need to on highly sensitive machines?

Network ACL has not gotten in our way yet. By default, it allows all traffic to flow through the VPC. It is stateless so adding rules to it may break app.

And this is why I love Terraform. Terraform creates resources exactly the way you specify it to, no surprise like that "catch all" main route table or the default outbound rule being enabled on every security groups.