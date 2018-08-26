---
title: "Cloudtrail events to slack"
date: 2018-08-26T00:50:35+10:00
draft: false
---

Another side track during my study for AWS cert! :) This time it is all about slacking off and write some lambda!

Ok so the goal is to have CloudWatch event to trigger on every Console login and eventually send that information of login attempt to Slack for monitoring.

Here is top view of how it work:

CloudTrail log the event --> CloudWatch Event Rule triggers --> Triger Lambda function to send Slack message

While building this I ran into several noobies mistaks and problems:

 - Used the wrong Event pattern (CloudWatch Log & CloudTrail while there is a specific AWS Console Sign In type)
 - Overcomplicated the solution by creating an SNS topic for lambda to subscribed to and then publish the event to SNS topic


Below is simple Event pattern that can be used to detect login event in CloudWatch Event --> Rules

```json
{
  "detail-type": [
    "AWS Console Sign In via CloudTrail"
  ]
}
```

The following lambda code was written with help from other people codes which cover similar topic. In most scenario, these tutorials show how to send a metric triggered Event to SNS to Lambda function hence why i was confused.

Note that there are 2 handlers here and both of them work but by showing both of them, I hope to give myself in the future an idea of the differences between triggering lambda function through SNS topic and directly call it (mostly the fact that SNS will wrap some JSON around it)


```Go
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
)

// This example message can be seen when you create the rule above. 
// VERY USEFUL TIP: Click the "Show sample events" to see this message that will 
// be sent to the lambda function so you can write code around it.
var sampleMessage = `
{
	"version": "0",
	"id": "9343-343434-34343-3772",
	"detail-type": "AWS Console Sign In via CloudTrail",
	"source": "aws.signin",
	"account": "11111111111",
	"time": "2018-08-25T14:13:37Z",
	"region": "us-east-1",
	"resources": [],
	"detail": {
		"eventVersion": "1.05",
		"userIdentity": {
			"type": "IAMUser",
			"principalId": "ASDSADASDASDASD",
			"accountId": "0000000000",
			"accessKeyId": "",
			"userName": "usernamehere"
		},
		"eventTime": "2018-08-25T14:13:37Z",
		"eventSource": "signin.amazonaws.com",
		"eventName": "ConsoleLogin",
		"awsRegion": "us-east-1",
		"sourceIPAddress": "124.169.26.213",
		"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
		"errorMessage": "Failed authentication",
		"requestParameters": null,
		"responseElements": {
			"ConsoleLogin": "Failure"
		},
		"additionalEventData": {
			"LoginTo": "https://console.aws.amazon.com/console/home?region=us-east-1&state=hashArgs%23&isauthcode=true",
			"MobileVersion": "No",
			"MFAUsed": "No"
		},
		"eventID": "e0eba2e0-9319-4662-993b-35183a79e491",
		"eventType": "AwsConsoleSignIn"
	}
}`

// SignInMessage struct that will parse the message above and pulling out relevant info
type SignInMessage struct {
	Region     string `json:"region"`
	DetailType string `json:"detail-type"`
	Detail     struct {
		EventTime    string `json:"eventTime"`
		EventName    string `json:"eventName"`
		UserIdentity struct {
			UserName string `json:"userName"`
		} `json:"userIdentity"`
		Type             string `json:type`
		ErrorMessage     string `json:"errorMessage"`
		ResponseElements struct {
			ConsoleLogin string `json:"ConsoleLogin"`
		} `json:"ResponseElements"`
	} `json:"detail"`
}

var (
    ErrParsingJson          = errors.New("Cannot unmarshal Message")
	ErrInvalidStatusCode    = errors.New("invalid status code")
	ErrSlackWebhookNotFound = errors.New("slack webhook not found in env variables")
)

// This here is example of SNS request message struct send to lambda function.
// The request.Records[0].SNS.SNSMessage is the raw string of our message above.
type Request struct {
	Records []struct {
		SNS struct {
			Type       string `json:"Type"`
			Timestamp  string `json:"Timestamp"`
			SNSMessage string `json:"Message"`
		} `json:"Sns"`
	} `json:"Records"`
}

// The Slack payload we prepare to be marshaled into JSON later and send to Slack server
type SlackPayload struct {
	Text      string `json:"text"` // To create a link in your text, enclose the URL in <> angle brackets
	Username  string `json:"username,omitempty"`
	IconURL   string `json:"icon_url,omitempty"`
	IconEmoji string `json:"icon_emoji,omitempty"`
	Channel   string `json:"channel,omitempty"`
}

// Here is example of how to handle the request from SNS in our lambda.
// It will first unmarshal the SNSMessage into the correct message struct we defy
func SNSHandler(request Request) error {
	log.Printf("processing message from SNS: %v\n", request)
	var signinmsg SignInMessage
    err := json.Unmarshal([]byte(request.Records[0].SNS.SNSMessage), &signinmsg)
    if err!= nil {
        return ErrParsingJson
    }
    return DirectHandler(signinmsg)
}

// Here is the direct Handler if we specify the Event Rule to directly execute this function
func DirectHandler(signinmsg SignInMessage) error {
	log.Printf("processing message from SNS: %v\n", signinmsg)
	slackURL, found := os.LookupEnv("SLACK_WEBHOOK")
	if !found {
		return ErrSlackWebhookNotFound
	}
	if signinmsg.Detail.UserIdentity.UserName == "" || signinmsg.Detail.UserIdentity.UserName == "HIDDEN_DUE_TO_SECURITY_REASONS" {
		return nil
	}
	payload := SlackPayload{
		Text: fmt.Sprintf("%s - %s - %s - %s", signinmsg.Detail.EventName, signinmsg.Detail.EventTime, signinmsg.Detail.UserIdentity.UserName, signinmsg.Detail.ResponseElements.ConsoleLogin),
	}
	log.Printf("Sending to Slack: %s\n", payload.Text)
	payloadJSON, _ := json.Marshal(payload)
	resp, err := http.Post(slackURL, "application/json", bytes.NewBuffer(payloadJSON))
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return ErrInvalidStatusCode
	}
	log.Printf("Slack notified")
	return nil
}

func main() {
	lambda.Start(DirectHandler)
}
```

 ## Ideas

We can potentially extend the functionality of this simple lambda function to do the following:

  - Having lambda function to get user's email or slack account either through IAM or look up table and notify them when there is a successful login.
  - The above notification can embed a link that when clicked will notify administrator of the unauthorised access and temporary disable the account - This can be done with another higher privilege lambda function - The earlier function can generate a signed message with short time to live. This message can be consumed and validate by 2nd lambda function and pull neccessary information to :
    - Send notification to Administrator
	- Temporary disable the account through IAM


That's it, enjoy!