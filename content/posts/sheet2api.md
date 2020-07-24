---
title: "Sheet 2 API!"
date: 2020-07-20T00:50:35+10:00
draft: false
---

Recently we needed a way to share the management of a lambda function with other team, the shared responsibility is to update a list of interesting patterns to trigger alerts on. This could potentially be done with a config file in the repository of the lambda function and redeploy the lambda function on every commit. With that said, i wanted to explore a simpler way to do it, especially when the other team is slighly less technical, the lambda function is not business critical and so sheet2api came about.

Turn out exposing googlesheet data as a JSON api is much easier than i think with just a few lines of app scripts! Below is a screenshot of this happens.

![sheet2api](/static/sheet2api.png)

To put it simply, this [googlesheet](https://docs.google.com/spreadsheets/d/1UVW_OD61kB5mGamK7fTFfi1JUlIq2cKhfao_6r2tivA/edit?usp=sharing) is exported to [this api](https://script.google.com/a/macros/ebfe.pw/s/AKfycbzjiaAZrVB3eId_AD6vIsvJoYOW2jsy_Sq0xUl9xBU8RrmBu2k/exec?key=somesecret) (notice the key parameter can be used to toggle what column information you want to show). 

I went a little bit further and sprinkled some HTML ontop and you could even display it as a sortable table as showned [here](https://script.google.com/a/macros/ebfe.pw/s/AKfycbzjiaAZrVB3eId_AD6vIsvJoYOW2jsy_Sq0xUl9xBU8RrmBu2k/exec?table=true&key=somesecret) (notice the URL has `table=true` parameter).

Of course, we can also go even further and add a google Form ontop to let people input new data like [this](https://docs.google.com/forms/d/e/1FAIpQLSfCgsvx-EcZ1o7pd395XkTeeyRWlARqB9NIwA9YZKFXKEbuPw/viewform)

Below is the simple script to expose data in the google sheet above as json API. Note that the sheet does not have to be publicly accessible for the script to work.


```javascript
var mysheetid="1UVW_OD61kB5mGamK7fTFfi1JUlIq2cKhfao_6r2tivA"
var debug=true;
var apikey="somesecret"

function printdebug(txt){
  if(debug){
//console.log(txt);
    Logger.log(txt);
  }
}

// Get the top row, use getBackground() to check which collumn is included in api base on color
function getDataToJSON(includesecret){
  var ss = SpreadsheetApp.openById(mysheetid);
  var firstsheet = ss.getSheets()[0];
  var rowsdata = firstsheet.getDataRange().getValues();
  var toprow = rowsdata[0];
  var selectedCols={};
  
  for (i=0;i<toprow.length;i++){
    cellcolor=firstsheet.getRange(1, i+1).getBackground();
    // if the col name is white... select it to display
    // Because googlesheet range starts from 1 we add 1 for all of these getRange calls
    printdebug("Color for current cell:"+cellcolor)
    if (cellcolor == "#ffffff"){
      printdebug("Adding "+firstsheet.getRange(1, i+1).getValue()+" to our selected Cols");
      selectedCols[firstsheet.getRange(1, i+1).getValue()] = i
    }
    // If includesecret is set, include cells with red background too!
    if (includesecret && cellcolor == "#ff0000"){
      printdebug("Adding "+firstsheet.getRange(1, i+1).getValue()+" to our selected Cols");
      selectedCols[firstsheet.getRange(1, i+1).getValue()] = i
    }
  }
  finaldata=[];
  for (i=1; i<rowsdata.length;i++){
    var item={};
    for (colname in selectedCols) {
      item[colname]=rowsdata[i][selectedCols[colname]];
    }
    finaldata.push(item);
  }
  displaytable(finaldata);
  return finaldata;
}

function doGet(e){
  printdebug(e);
  includesecret=false;
  if (e.parameter["key"] == apikey){
    includesecret=true;
  }
  var finaldata=getDataToJSON(includesecret);
  // Return JSON data and set content type to application/json
  return  ContentService.createTextOutput(JSON.stringify(finaldata)).setMimeType(ContentService.MimeType.JSON);
}

```