---
title: "Building a slackbot with aws lambda"
date: 2019-02-05T20:58:33+11:00
draft: false
---

Recently i needed to build a small slackbot and go + aws lambda seems to be a good choice for the job.

### Slack API

A good library for communicating with slack API can be found here: https://github.com/nlopes/slack 

#### 1 - Every request from Slack is signed

Every request from slack are signed and can be verified with the following code. Note that the code does not take in a http.Request object but the value of the `X-Slack-Signature` and `X-Slack-Request-Timestamp` along with the requestbody so i can reuse this code to either handle requests from AWS APIGateway or running this code as http server.

 ```go
 // VerifyRequest - Verify every requests coming from Slack is signed properly.
func (sc *SlackClient) VerifyRequest(signatureheader, timestampheader, requestBody string) error {
	message := fmt.Sprintf("v0:%v:%v", timestampheader, requestBody)

	mac := hmac.New(sha256.New, []byte(sc.SlackSigningKey))
	mac.Write([]byte(message))

	actualSignature := "v0=" + string(hex.EncodeToString(mac.Sum(nil)))
	if actualSignature == signatureheader {
		return nil
	}

	return errors.New("invalid token")
}

 ```

#### 2 - URL Verification challenge

When registering a new slackbot, an URLVerification request is POST to the slackbot server with a challenge in the body. This same challenge needs to be included in the reply coming back from my chat server.

#### 3 - Bot's message itself to private channel with an user will also be forwarded to slackbot.

During the development of this slackbot, i noticed that every private message my slackbot sent to an user will also be reflected back to the slackbot itself. This obviously will incur a small extra fee for my slackbot lambda function.

To filter these type of bot messages, we can use the SubType property of the slack's message event like the code below:

```go
switch ev := innerEvent.Data.(type) {
case *slackevents.MessageEvent:
			if ev.SubType == "bot_message" {
				break
			}
			// If this is a private message with our bot:
			if ev.ChannelType == "im" {
				// do something meaningful here
			}
}
```


#### 4 - Think about slack event api retries
While writing this chatbot i ran into an interesting issue. I redeployed my chatbot with the exact same terraform deployment to south-east-2 region instead of us-west-1 and suddenly my chatbot become very chatty and repeated tasks. How did geolocation affected this?

The answer is because Slack Event API will automatic retry on what it deems as failure requests. One of the criteria for a failure request is when the chatbot server takes longer than 3s to reply to slack server with a 200 OK. This was a problem because even though 3s is very long, my chatbot connects to multiple HTTPS API to perform its task before responding to APIGateway a 200 OK reply to slack. 

There are a couple ways to resolve this issue.

The proper way to address this issue is to introduce some kind of message queue or database to the app so I can store the request coming from slack and later process it which let our code immediatelly return a 200 OK after pushing the job to a queue.

A more hacky way if you don't care about deliverability is to look for instances that the request from slack contains `X-Slack-Retry-Num` header and immediately return 200 OK. This header is added to retry requests and if I assume that the first request reached our slackbot and is being processed, I want slack to stop spamming us.

*Note about goroutine:* 
I have also tried creating multiple worker goroutine at the time lambda initialise which automatically pick up jobs from a channel. Whenere a slack message arrives, i would shove this request into the queue and immediately return a 200 OK. This may sound like a good idea at first but i can tell you right now that it does not work **with AWS LAMBDA**. The reason for that, and after hours of debugging, is because the moment you return 200OK in your lambda handler to API Gateway, All your computing tasks are "paused/sleep" until the lambda function is called again at which point it would "resume" all computing tasks. Funky huh? This may sounds weird at first but if you know the way AWS bill lambda base on computing time, it sorta makes sense. Looking at cloudwatch log i can tell that the billing is calculated for the period of time it takes for your lambda handler runs. I'm not entirely sure how they do it underneath but the only way for me to find out was to put alot of debug code in and noticed that when i first send a message, the lambda function does not send a message back to my private channel immediately as the worker go routine is still working on the task. The execution is then contiued when I sent a subsequent message, triggers the lambda function and i received the reply I would have expected for the first message.

### AWS Lambda


#### Quirks and tips

Some of the thing that could affect your lambda:

 - It is not guaranteed that your lambda will execute the same task in the same container all the time. Everytime slack server reaches our slackbot lambda function, it could run in a completely different container and thus we should never store any persistent data on our lambda function.
 - Lambda function will pause all execution on all threads when you return from main handler
 - If you are building tools using SNS topic, the original message is wrapped in SNS message
 - By default resources within a VPC is not accessible from within lambda. If you want to access anything in your vpc, you will need to use vpc-config and bind it to whichever subnets you want your lambda function to execute and have proper security group attaches to it.
 - Timeout for lambda function, by default, is set to 3 seconds which could be too short for your application. This value can be increase up to 15 minutes
 - Lambda function retry behavior is something to take note of as this could cause lambda function become noisy with error retries https://docs.aws.amazon.com/lambda/latest/dg/retries-on-errors.html 
 - The IAM Execution Role used by lambda function should always include the following to let lambda function to assume the role and create logs

```
 {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    },
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
```


