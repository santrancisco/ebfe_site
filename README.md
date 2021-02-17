#### Intro

Trying out Hugo for static site generator ;)

Previous deployment was overcomplicated so i can be bother to learn serverless framework and build something meaningful: 

 - Github commit Webhook to lambda function served by API Gateway
 - Go Lambda function runs hugo to build&push static blog to s3 bucket
 - S3 files are served behind cloudfront

Since this blog is mostly updated by me from my laptop, I have simplified the deployment to just a single deploy.sh script that runs hugo locally and `aws s3 sync` files up to our bucket
