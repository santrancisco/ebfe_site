---
title: "AWS 101 Network lab"
date: 2018-08-24T20:14:55+10:00
draft: false
---

This lab is kinda like a Helloworld for AWS networking I built when I first did my Associate exam so i will share it here. It walks you through creating a VPC from ground up and walk you through why things aren't working (yet).

### Intro ###

How to follow this lab:

_These are questions that would help guide your thought process throughout the lab as to why things do not work_

- __[x]__ These
- __[x]__  are
- __[x]__  the steps to follow :)

__NOTE:__ Interesting facts or reminder will be in here

### Plumbing ###

- __[x]__ Create a VPC
- __[x]__ Create 2 subnets, one for private and another for public
- __[x]__ For public subnet, Use `Modify auto-assign IP settings` to enable auto-assign public IPv4
#### Provision ###

Let's create 2 ec2 instances now

- __[x]__ 1 in public subnet 
  - Make sure to check that public ip will be given in the launch wizard
  - When prompted, create a new security group or just use the default which allow port __22__ to access from any ip.
- __[x]__ 1 in private subnet

_Can we ssh to the ec2 in public subnet which has public ip assigned to it yet?_

__NO__! Every new VPC cannot talk to the internet. We need an `Internet gateway` attach to it

 - __[x]__ Create a new Internet gateway and attach it to right VPC

#### Routing ###

_Does ssh to ec2 in public subnet work now?_

__NO__! The internet gateway is attached to the VPC but the route table has not been modified!

 - __[x]__ Add `0.0.0.0/0 to Internet gateway` route to the main routetable, created by default when VPC is created.

 __NOTE__: DO NOT do this in your actually work environment, See the Thoughts section below for further explanation after you finish the lab.

 _Does ssh to ec2 in public subnet work now?_

__YES__! VPC has Internet gateway to reach out, our default internet route is in place, our default security group on the EC2 instances are allowing us IN!

_Does `curl http://google.com` works on the public EC2 ?_

__YES__! The Security Group we created during Provision section above, by default (and you can't change this at creation due to GUI limitation but can edit later), will allow all outbound traffic!

#### Security Group ###
You can skip this or `apt-get install apache2` to play with this

_Does http traffic work now if you have apache runs on the public box?_

__NO__, not yet! Our request probably hits the machine but it is dropped due to our strict Security Group

- __[x]__ Create a security group that allow all incoming on port __80,443__
- __[x]__ Attach this rule to the public EC2 machine

 __NOTE__: Click the outbound rule tab, notice that by default, Security group allows all outgoing traffic unless specified.

_Can we access port 80 & 443 now?_

__YES__! 👍


#### NAT GATEWAY ###

- __[x]__ ssh to Private EC2 from Public EC2

_Can you ping back the Public EC2 machine (check established conn with `netstat -tp`)?_

__YES__!

_Can you ping 8.8.8.8 from Private EC2?_

__NO__! By default, all new subnets are added to the `main` route table. This route table is now having just 2 routes, one to the local ip range and the other is default route (0.0.0.0/0) to the Internet Gateway. However, To receive and send packet via internet gateway, an EC2s needs a `Public IP`. Public IP is provisioned by default to machines launched in our public subnet only because of Modify auto-assign IP settings configuration we set above.

__NOTE__: Right now, even though we call it a "private" subnet, the settings are completely the same for the private and public subnet. They have the same route table (the main route table created along with the VPC), and thus, its default route route is also pointing to our Internet Gateway. If someone creates an elastic public IP and attach it to the private EC2, it will be accessible from the internet.

Let's do proper thing and get these machines in private subnet to talk to the internet securely!

- __[x]__ Create a NAT Gateway, you will be asked to put it in a public subnet AND request a new Elastic IP address on the internet.
- __[x]__ Create a new route table (we can't use the main route table because it is associating with Internet Gateway)
- __[x]__ Add default route (0.0.0.0/0) to point to the NAT gateway we just created.

__NOTE__: NAT Gateway is installed on where the AZ of the public subnet sits. You can share nat gateway across AZ but it's prone to single failure that may bring down the environment.

_Can we now ping 8.8.8.8 from the Private EC2?_

__NO__! Because you have not associate the Route table to any of the private subnet YET!

- __[x]__ Force association between the new private ip table AND the private subnets

_Can we now ping 8.8.8.8 from the Private EC2?_
__YES__!



#### Super secret network ####

__This is the extra stuff I worked on to prepare for the Security Specialist exam.__

- __[x]__ Create another subnet & name it super-private
- __[x]__ Add super-private subnet to our private routetable
- __[x]__ Launch an instance into our super-private subnet
- __[x]__ Attach security group to instance to allow port 22 and ICMP inbound and all outbound.

_Will you be able to ping or ssh to this machine directly from your public subnet ?_

__YES__! The configuration for this EC2 instance and subnet is exactly the same as the configuration of our earlier private subnet!

_Will you be able to ping or ssh to this machine from your second jumpbox in the private subnet ?_

__YES__! Again, there is no restriction in default Network ACL, all traffic in the VPC are allowed to flow to each other and back. Security Groups allow inbound and outbound traffic, everyone is happy!

_What if we want this super-private can only be managed by instances in managed subnet?_

Sure, we can start adding more security groups which only allow resources from other subnet beside the public subnet to hit it. However, this will grow and hard to manage when we have more subnet created.

Let's try with network ACLs:

 - __[x]__ Create a new Network ACLs - Call it restricted if you want.
 - __[x]__ Create the rules as specified in the table below
 - __[x]__ Attach the Network ACL to the super-private subnet.

__Note:__ Network ACL will always have a catch all rule that DENY all traffic both inbound and outbound.

__Note:__ Notice that each subnet can only attach to ONE Network ACL.

__Inbound__

-----------------------------------------------------------------
| Rule | Type      |Protocol|PortRange|Source          |Allow/Deny|
------|-----------|--------|---------|----------------|----------
|100   |ALL traffic| ALL    | ALL     |pub-sub-cidr    | DENY     |
|200   |   SSH(22) | TCP    | 22      |private-sub-cidr| ALLOW    |
|300   |ALL traffic| TCP    | ALL     |private-sub-cidr| DENY     |
|400   |ALL TCP    | TCP    | ALL     | 0.0.0.0/0      | ALLOW    |
|\*    |ALL traffic| ALL    | ALL     | 0.0.0.0/0      | DENY     |

__Outbound__

-----------------------------------------------------------------
| Rule | Type      |Protocol|PortRange|Destination     |Allow/Deny|
------|-----------|--------|---------|----------------|----------
|100   |ALL traffic| ALL    | ALL     |pub-sub-cidr    | DENY     |
|200   | ALL TCP   | TCP    | ALL     |private-sub-cidr| ALLOW    |
|300   | HTTP      | TCP    | 80      | 0.0.0.0/0      | ALLOW    |
|400   | HTTPS     | TCP    | 443     | 0.0.0.0/0      | ALLOW    |
|\*    |ALL traffic| ALL    | ALL     | 0.0.0.0/0      | DENY     |

Explanation (not steps to follow 😅):

 - When decision is made on a network package, Network ACL tries to match the package with the rules condition (Type, Protocol, Port Range, Source/Destination), starting from the lowest rule number (in this case, rule 100 will be checked first then 200, 300, and so on). When a match is found, the decision of that rule is final.
 - Inbound rule 100 & Outbound rule 100 keeps public subnet drop packages from our public subnet.
 - Inbound rule 200 and outbound rule 200 allows bastion host from our normal private subnet to manage our super-private instances via SSH (We allow incoming on port 22 and allow tcp outgoing to any port on the instance in normal private subnet cause we don't know exactly which high port they will come from)
 - Inbound rule 300 blocks all other traffic originating from our normal private subnet
 - Inbound rule 400 and outbound rule 300 & 400 allow our instances in private-subnet to talk out to the internet on port 80 and 443 to do update/patch. Note that This is still going through our NAT Gateway so our private instance is not exposed to the internet directly.
  
  __Note__: The traffic originate from our instances to go to internet via the NAT Gateway will has source ip as our private ip and destination ip can be any IP in the world. The NAT will handle the 
  translation when it goes out to the internet. When NAT instance receive the response, it will transform the package again and replace the destination ip address (its public ip address in the internet) with the instance's ip address. So The Nat Gateway ip address is never shown in the traffic flow within the VPC and thus, Network ACL rule that block traffic to&from all ip in public subnet cidr range does not get trigger.

  __Note__: For simplicity i just let ephemeral ports (originating source port) to be ANY/ALL but you can tighten it even more by look it up [here](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html#nacl-ephemeral-ports)

_Can we now ssh to the super private EC2 machine only from our private EC2?_

__YES__! The Network ACL block all inbound traffic from public subnet, the super private subnet is behind NAT Gateway so no machine on the internet can hit it directly on port 22. The only port 22 allow in Network ACL is the ones originate from our normal private subnet cidr range.

_Can we curl google.com from the super private EC2 instance?_

__YES__! We can because HTTP&HTTPS requests are allowed from super private subnet! And we do have matching inbound rule to allow website send replies to high source port (known as ephemeral ports) picked by curl command.

_Can we ssh out to other machines from our super private subnet instance?_

__NO__! There is no rules combination that would allow this to work. There is potentially of inbound rule 200 and outbound rule 200 to make this work but for that, a customed SSH client is required to FORCE the source port from the super private instance to also be 22 ? 🤷‍♂️


#### Thoughts ###

Now we know that route table `main` is a catch all for all subnets, perhaps, it should be left alone and never be used. That way, every new subnet being created, it won't be connected to the internet immediately until specified which route table it should be associate with.

Always check outbound rules on security groups.. you may allow traffics that you don't need to on highly sensitive machines?

Network ACL, by default, allows all traffic to flow through the VPC. It is stateless so adding rules to it may break app. Keep in mind that when TCP client initiates the connection, it will pick a random high port so if you want to allow the connection, think about the return traffic and make sure your rule allow "inbound" (if the traffic originate from machine inside the subnet we try to protect) or "outbound" (if the traffic originate from machine OUTSIDE the subnet) accordingly.

And this is why I love Terraform. Terraform creates resources exactly the way you specify it to, no surprise like that "catch all" main route table or the default outbound rule being enabled on every security groups.


