---
title: "Terraforming Spark cluster in AWS"
date: 2018-08-28T04:24:37+10:00
draft: false
---

Recently we needed Spark for our semi-"bigdata" project at work, upon looking online for how to set up a cluster or spark nodes, our team came across flintrock which is told by many enthusiasts that it is the easiest way to get Spark running in AWS with minimal effort.

To that point, I agree, the effort put into getting a spark instant running is very little and compared to EMR, this option is much cheaper but I was not fully convinced. Understandably the developer made a decision to create another devops tool to manage Spark because he didn't like all the other heavy framework and building the app is fun for him.

With that said, considering our environment is mostly managed by combination of Terraform for plumbing, some Ansible for machines' deployment & hardening and in some deep dark corner, we have serverless framework for lambda functions (which really is cloudformation). And because of that, I was not keen to introduce yet another tool to manage just a single piece of software/deployment.

And that is where this Spark Terraform module comes in. You can find it here: [https://github.com/santrancisco/terraform_spark](https://github.com/santrancisco/terraform_spark)

This module is written to simply deploy an EC2 instant as the spark Master node and the rest of the slave nodes are spot instances to save money (just like flintrock). Note that this deployment is a spark standalone deployment and does not include hadoop or yarn.

Here is an example of how you would deploy this spark cluster code in production:

```

module "spark" {
vpc_platform_id = "${module.core_network.vpc_platform_id}"
source = "./terraform_spark"
name = "awesome"
key_name = "NameForAWSKeyPair"
Master_instance_type = "m3.medium"
slave_instance_type = "m3.medium"
ebs_optimized = false
subnet_id = "${module.core_network.apps_subnet_ids[1]}"
spot_price = "0.0095"
account_id = "${local.account_id}"
fleet_private_key = "${var.spark_fleet_key}"
slave_asg_min_size = 1
slave_asg_max_size = 3
slave_asg_desired_capacity = 1
security_groups_ids = ["${module.core_network.allip_egress_security_group_id}",]
}

```

Here is how it works behind the scene:

Resources:
- 1 x Security groups to allow all spark nodes talk to each other
- 1 x Route53 Internal DNS zone and is used to look up records by all nodes
- 1 x IAM role with access to Describe EC2 Instances
- 1 x S3 bucket with bucket policy allows READ & WRITE access for the IAM role above.
- 1 x Launch Configuration with instance type and user-data provided
- 1 x Autoscaling Group (ASG) with spot instance pricing bid, min_size, max_size and desired_size specified by variables pass to the module

Master node EC2: 

- Create ec2 instance in specified subnet
- Attaches security group above to allow all spark nodes talk to each other
NOTE: you may want to add more security group to allow outbound internet access or other bastion host access (or attach this security group to those host, up to you)
- Attaches IAM role above to the ec2 instance for S3 access and READ access on EC2 & AutoScaling groups.
- Master node executes user-data deployment script that does the following:
- Download Spark binary
- Write User's private key to file. This is passed to module as a variable.
- Use ssh-keygen to get back public key from the private key and write it to ~/.ssh/authorize
- Start a script in background to periodically check for changes to AWS Autoscaling group and write the list of all slave nodes' IP to /conf/slaves file. This file tells Master node where all slave nodes are and use it to schedule jobs
- Start Master node script

Slave node Autoscaling group:

- ASG does the bidding for spot instances and set up in specified subnet by the user
- Attaches security group above to allow all spark nodes talk to each other
- Attaches IAM role above to the slave nodes as well for S3 bucket
- Slave nodes executes user-data deployment script that does the following:
- Download Spark binary
- Write User's private key to file. This is passed to the module as a variable.
- Use ssh-keygen to get back public key from the private key and write it to ~/.ssh/authorize
- Start slave node script with the following argument "start-slave.sh Master.{deployment_name}-spark:7077" (This is the reason why we have Route53, if we used the aws_instance.private_ip we run into a catch 22 where ASG needs access to private IP/hostname of the Master node and the Master node need to know the name of the ASG once it is created.)


__Conclusion:__ Though this module definitely requires more work, for example, there is that problem of having private keys used by master&slave nodes to SSH into each other being stored in clear text in the user-data of each box for now, this implementation addressed the most important thing i wanted which is having as little amount of tool to manage our infrastructure so things won't break in unexpected way.