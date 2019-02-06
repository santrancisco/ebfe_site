---
title: "Learning Go again in 2019"
date: 2019-02-05T20:58:33+11:00
draft: false
---

Recently i needed to build some tools in go. To be more specifically, a chatbot running in aws lambda and a cli tool. Here are some cool tricks i picked up along the way:

### Use go module

It's probably the coolest thing i found in the latest version of go. It blew my mind instantly when someone at work showed it to me. You can now build your code wherever you want, not even under GOPATH. your go.mod and go.sum file will automatically add the semantic version you refer to thus your build is consistent. 

The wikipedia for this has a lot of information on how to use go module.

Some notes about go module:

  - The libraries are downloaded to your $GOPATH/src/pkg/mod folder. 
  - If the library has no version, you will get a v0.0.0 and a timestamp attach to it.
  - As long as the root folder of your go code contain go.mod file which specifies the name of the module you are working on, any submodule (eg cmd) will know to reference any libraries, submodules you may have under this folder you are working on.
  - `go mod vendor` will create a vendor folder with all dependencies in it.
  - Using `replace github.com/santrancisco/somemodule => ~/localpath/somemodule` in go.mod file will allow you to reference a local copy of another library/module you are working on.

### github.com/pkg/errors

errors is a great library that allow you to add context to your error messages without losing the original error message.

Take this code as an example:

```go
_, err := ioutil.ReadAll(r)
if err != nil {
        return errors.Wrap(err, "read failed")
}
```

The original error is retained but you can now easily trace it back to where this error is thrown in your code.


### format print is costly

Sprintf, Printf are costly... I know this is the case and was reminded again but didn't realise until i looked up some bench marking done by [others](https://gist.github.com/dtjm/c6ebc86abe7515c988ec) and really see the different.

So for any tasks that we want to squeeze every bit out of optimisation, concat string using "+" might be the best way to go.

### Type switch

Sometimes you need to parse data with unknown type, it's simple to do type switch in go like below:

```go

func do(i interface{}) {
	switch v := i.(type) {
	case int:
		fmt.Printf("Twice %v is %v\n", v, v*2)
	case string:
		fmt.Printf("%s was a string\n", v)
	default:
		fmt.Printf("I don't know about type %T!\n", v)
	}

}

```