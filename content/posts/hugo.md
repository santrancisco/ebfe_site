---
title: "Hugo blog from Git to Cloudfront"
date: 2018-08-25T17:41:53+10:00
draft: false
---

[Hugo](gohugo.io/hugo-nuo/) is a static site generator written in Go. I had a look at it in the past and really wanted to try out for future website projects. Today, while looking for any reasons to not study for my AWS exam, I thought of an idea (which is probably  not new anyway) to use Hugo together with a lambda function and build a small CI/CD pipeline to deliver site content from github straight to Cloudfront. 


The project is really just 2 github projects, the [hugo version for ebfe blog](https://github.com/santrancisco/ebfe_site) and a [lambda function written in Go](https://github.com/santrancisco/hugotocloudfront), deployed with serverless framework.


How it works from end to end is simple:

To update website content user will need to do the following: 
 - Clone the github repository of the blog
 - User create new content in ebfe_site using `hugo new posts/anewpost.md`
 - User push the commit to github

And that is it. The following actions will happen in the background and update the Cloudfront content for you:

 - A webhook is fired from Github to the AWS APIGateway which pass the request to our Lambda function
 - Lambda function validate the webhook is valid using the shared secret key
 - Lambda function download the latest zip archive of the website from github
 - Lambda function use Hugo `Command` function to build the site (no, we don't "shell" out here, it just uses Hugo like a standard library)
 - Lambda function delete old contents from the S3 bucket specified by user
 - Lambda function bulk update new content to the S3 bucket 
 - Depends on behavior setting in Cloudfront distribution setting, the new website's content will be updated later. If it's urgent, user can invoke an invalidation request in Cloudfront GUI or from AWS-CLI.

 According to many sources online the cost of running these services are very cheap (Some one mentioned it only cost him 1$ a month to keep a site up). This is because most of these services are almost free until the bandwidth excess certain threshold.