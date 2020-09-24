---
title: "S3 to Redshift with the help of AWS Glue :)"
date: 2020-09-24T22:00:35+10:00
draft: false
---

Sometimes the path to copy large amount of unsorted data from S3 to Redshift is a bit annoying. Recently I had to deal with large amount of unsorted JSON input log. These JSON come in with different attributes, tags, type, values and it was difficult to work out the schema without spending a great deal of time going through them manually or running script to pick up the logs, run some logic across to identify new fields etc... 

AWS Glue come to rescue! I first used Athena to play around with the data and a colleague of mine found Redshift spectrum, which, during setup  would run you through setting AWS Glue. This tool would crawl over your data and identify tables and schema that would fit the given data! How neat!

Fast forward, I wanted to attempt flatten the JSON and chuck it into a redshift cluster. I knew a lambda trigger on S3 objectcreate event would be perfect for the job and it can simply send a COPY command over to Redshift to let it migrate data to our cluster. Turn out, I did not have to write a single piece of code for that, AWS has already done it for me in this [blog post](https://aws.amazon.com/blogs/big-data/a-zero-administration-amazon-redshift-database-loader/). It is not overly complicated but you have to be comfortable with deploying cloudformation stack, managing lambda function & its dynamodb to queue job and using the utility tool writen in Nodejs to create configurations for our lambda function.

After getting all that setup, my next task is to create Redshift table... To quickly try sending data to the cluster, i manually went through some files, picked out some common fields, wrote CREATE TABLE command by hand and it worked great. However, when i looked at the glue schema, turn out it is ALOT more than i thought (it worked out to be around 300 columns in the end after you expand every nested json). This is, of course, not including the fact that I need to generate a [JSONPath](https://docs.aws.amazon.com/redshift/latest/dg/copy-usage_notes-copy-from-json.html) file to tell Redshift which field/column relates to which nested json object. This JSONPath file has to be perfectly aligned with the column in CREATE TABLE command for redshift.

It was clear that the job can be done a lot quicker to write a parser for glue result to create table . Glue is very good at identifying the data structure you deal with. After glue runs, you can run  `aws glue get-tables --database-name {your db name} > glue.json` to get the tablelist and their data structure. This file contains column information for your data. This script runs over it and generates `CREATE TABLE` command for AWS Redshift and a working jsonpath.json file that you can use to load data using COPY command straight from S3 to your Redshift. Below is an example of what a manual COPY command look like

```
COPY SchemaName.TableName from 's3://bucketname/objectid'
iam_role 'arn:aws:iam::0123456789012:role/MyRedshiftRole'
JSON 's3://bucketname_where_you_host/jsonpath.json' GZIP
region 'us-west-1';
```

Of course, to get files automatically ingested into Redshift the moment they are dropped into the bucket, I highly recommend checking out the [blog post](https://aws.amazon.com/blogs/big-data/a-zero-administration-amazon-redshift-database-loader/) above by AWS.

Below is the script to parse glue.json. Note that i wrote it quickly to parse the data for my need so you may have to tweak some regex, etc to fit yours.

```python
import json
import argparse
import re


parser = argparse.ArgumentParser()
parser.add_argument("file").required
args=parser.parse_args()

typemap={
    "longstring":"VARCHAR(MAX)",
    "string":"VARCHAR(MAX)",
    "int":"INTEGER",
    "boolean":"BOOLEAN",
    "double":"REAL"
}

f=open(args.file,'r').read()
j=json.loads(f)
# print (json.dumps(j))

col = None
typestr="type"
namestr="name"

if j.get("TableList") != None:  ## This is when we bother to run `aws glue get-tables`
    col=j["TableList"][0]["StorageDescriptor"]["Columns"]
    typestr="Type"
    namestr="Name"
else: ## This is when we deal with json copied straight from AWS Console WebUI network traffic (aka being lazy)
    col=j["actionResponses"][0]["data"]["tableVersions"][0]["table"]["storageDescriptor"]["columns"]

mymap = {}
for i in col:
    if i[typestr].startswith("struct<"):
        s=re.sub("array<[^>]*>","longstring",i[typestr])
        s=re.sub("map<[^>]*>","longstring",s)
        s=s.replace("struct<","{").replace(">","}")
        s=re.sub(r'(?<={|,)([^:]*)(?=:)', r'"\1"', s)
        s=re.sub(r'(?<=:)([a-zA-Z0-9]*)(?=}|,)', r'"\1"', s)
        inner = json.loads(s)
        mymap[i[namestr]] = inner
        # print(s)
    else:
        t=i[typestr]
        t=re.sub("array<[^>]*>","longstring",i[typestr])
        t=re.sub("map<[^>]*>","longstring",t)
        mymap[i[namestr]]=t
crt = "CREATE TABLE IF NOT EXISTS segment.eventlogs ("
jsonpaths = {"jsonpaths":[]}
jpath=[]

def simplerecurse(d,prefix,jprefix):
    global crt
    global jpath
    for i in d:
        # print ("%s - %s"%(i,d[i]))
        if isinstance(d[i],dict):
            p = prefix+i+"_"
            jp = jprefix+"['"+i+"']"
            simplerecurse(d[i],p,jp)
        else:
            crt += "\n%s%s\t%s,"%(prefix,i.replace(" ","").replace("-","_"),typemap[d[i]])
            jpath.append(jprefix+"['"+i+"']")

        
simplerecurse(mymap,"","$")
jsonpaths["jsonpaths"] = jpath
crt=crt[:-1]+"\n)"
f=open("crt.txt","w")
f.write(crt)
f.close()
f=open("jsonpath.json","w")
f.write(json.dumps(jsonpaths, indent=4))
f.close()
print (crt)
print (json.dumps(jsonpaths, indent=4))
```
