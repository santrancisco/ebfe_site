---
title: "DRAT - Dependency Risk Analysis Tool"
date: 2019-01-08T22:58:33+11:00
draft: false
---

Just before I left a government gig a few months ago, With my manager's approval I managed to opensource a fun project I worked on just before I left the organisation - [DRAT](https://github.com/GovAuCSU/DRAT). I came up with the idea for this project after battling through countless Nodejs and Ruby On Rails pentest. 

The idea is simple, give the app a project's repository, it will help developers to identify high risk dependencies. The risk we are talking about here are not vulnerable dependencies or out-of-date dependencies. There are already many tools out there solved that particular problem. Github even has it inbuilt now. 

The "risks" DRAT identify are things like : 

  -  [INFO] Repository is not managed under an organisation
  -  [MEDIUM] Repository has only been created for less than 30 days
  -  [MEDIUM] Size of collaborator for the repository is 1 which is less than 3
  -  [HIGH] Repository has not been updated for a year

DRAT also tries to show some good indicators to help users identify well-matained libraries

 - [GOOD] Repository has a wiki
 - [GOOD] Repository has been forked 100 times
 - [GOOD] Repository has been stared 3762 times
 - [GOOD] Repository is being watched by 3762 people

By now, i think you already have a pretty good idea what DRAT is used for.

The code for this project can be found at [https://github.com/GovAuCSU/DRAT](https://github.com/GovAuCSU/DRAT). Unfortunately the code went through a major rewrite and I did not have the chance to clean it up before I left. 

Originally I wanted this application to be hosted on AWS as a lambda function that continuously scan our organisation's github repositories and deliver the report through a website. However, we decided that the target audiences should be developers and having them run this tools themselve make more sense.

The graph component, however, was still useful and is now used to display the scan result to make it more intuitive

![drat](https://raw.githubusercontent.com/GovAuCSU/DRAT/master/images/drat_cli_gui.png)