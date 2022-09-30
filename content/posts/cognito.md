---
title: "010 Template study note"
date: 2022-09-29T16:15:45+10:00
draft: false
---

This blog has been dead for a while and I had a few blog post drafts stored in Notion so I thought I would just send a blurb here for fun & who knows it may helps someone.

## Rant

Cognito is half-baked solution provided by AWS, there are so many issues with it and I wish AWS would put in some efforts to make it more ... production ready.
One of the most annoying thing I found recently was the fact that cognito has Advanced Security but when you enable it to protect customers and use it to send "New sign-in" alert, you hit a major problem. This feature is useless by design - Yes, the email send out to the customer with a link to "Report bad login" but after users click on this button, the only thing it ever does is to switch a flag in the audit log shown in cognito UI that the customer marked the login event as "invalid" ... 

Wait.. if you stop for a moment and ask: 
 - Was the attacker's session gets kicked out?
 - Was the account locked until user reset the password?
 - Was there ANYTHING ELSE being done to protect the customer account?

The answer to all of them is a big fat "NO". Yeap... that is all you get out of the box - it "reports" the issue but does f***ing nothing. This is frustrating because this gives user a false sense of security - when user click on that button, says when they are out dining with their family, they expect the system to secure their account immediately. They don't want to come back from dinner only to find their account has been used for fraudulent stuffs.

I reached out to AWS TPM, the SMEs and the answer was  "It was by design" and "We will put in a feature request"... 

## Do something.

Ok so the real solution to this is to migrate to better Identity Provider but if you are in no position to switch to different IDP quicker but still want to do something for the customer, you can implement the following simple solution. Note that in my notification email to customers, I only send "bad login report" url and did not opt in to send "report good login" url as the Event_Feedback_GET from event bridge is an encrypted value and not possible to discern between these 2 events. 

1. Create a lambda function to catch event bridge event and lockout the user & terminate existing refresh tokens (example code below). This simple lambda also sends a notification to a slack channel , notifying administrator about the event.

```python
## This lambda needs 2 environment variable set:
## AWSREGION	us-east-2
## SLACKWEBHOOK	https://hooks.slack.com/services/{SLACKWEBHOOKURL}
import boto3
import urllib3
import os
import json
from botocore.config import Config


SLACKWEBHOOK = os.getenv("SLACKWEBHOOK", None)
AWSREGION = os.getenv("AWSREGION", 'us-east-2')

def send_alert_to_slack(message):
    print(message)
    if SLACKWEBHOOK == None:
        return
    http = urllib3.PoolManager()
    encoded_data = json.dumps({
        'text': message
    }).encode('utf-8')
    response = http.request("POST", SLACKWEBHOOK, body=encoded_data, headers={'Content-Type': 'application/json'})

def lambda_handler(event, context):
    try:
        boto3.setup_default_session(region_name=AWSREGION)
        username=event["detail"]["additionalEventData"]["requestParameters"]["user_name"][0]
        userpoolid=event["detail"]["additionalEventData"]["userPoolId"]
        userpooldomain=event["detail"]["additionalEventData"]["userPoolDomain"]
        client = boto3.client('cognito-idp')
        response = client.admin_reset_user_password(
            UserPoolId=userpoolid,
            Username=username
        )
        if (response.get("ResponseMetadata").get("HTTPStatusCode")!=200):
            raise Exception("HTTPStatusCode was not 200 when resetting password")
        send_alert_to_slack(":fire: Staging: Reset password was triggered for user {} in user pool {}".format(username, userpoolid))
    except Exception as e:
        print(str(e))
        send_alert_to_slack(":x: An user reported bad login event but lambda failed to revoke access.\nPlease check lambda log in Control Plane account")
    return True
```
2. Setup IAM role for lambda to reset password and lock out account:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "logs:CreateLogGroup",
            "Resource": "arn:aws:logs:us-east-2:{AccountID}:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:us-east-2:{AccountID}:log-group:/aws/lambda/badlogin-report:*"
            ]
        },
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "cognito-idp:AdminResetUserPassword",
            "Resource": "*"
        }
    ]
}
```

3. Setup event bridge rule to trigger a lambda function:

```json
{
  "source": ["aws.cognito-idp"],
  "detail": {
    "eventSource": ["cognito-idp.amazonaws.com"],
    "eventName": ["Event_Feedback_GET"]
  }
}
```

And voila - When your customer click on "Report bad login" url, it takes a minute or so for event bridge to trigger but you will receive a notification and the account is actually logged out + user receive a reset password email.

Another important thing you need to look into is the setting for how long Access token is alive - When this flow is triggered, the refresh token for JWT is revoked but the existing access token would still work until they are expired. I recommend setting access token to a small value like 5, 10 minutes.