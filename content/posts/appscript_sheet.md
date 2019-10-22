
---
title: "Sheets and script"
date: 2019-10-21T11:57:12+10:00
draft: false
---

Sometimes you have boring task such as scrolling through thousand lines of csv logs with TONS of columns and you have exhausted all your options using regex to help narrowing down things you are interested in, etc ... and it becomes pretty annoying to scroll horizontally to read 50+ row while reading the truncated content in tiny cells (It may help if you have 50" with 4k resolution though). This is why i wrote this shitty piece of code to eh... help. 

Obviously the code can be expanded easily to do something fun like replace the content of a markdown template by injecting cell values so you could copy and throw it into markdown-supported system.

Here is the appscript code for this app with lots of comments to help you (and future me) write your own later:

```javascript

// This script is triggered when sheet is opened and show a custom menu at the top. 
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
      .addItem('Get Entire Row', 'getRowInfo')
      .addToUi();
}

var selectedrow;
var currentrow = 0;

// This function is triggered when the button is clicked. It obtains the current row and the content of all collumns for that rows into global variable.
function getRowInfo() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  currentrow = sheet.getCurrentCell().getRow();
  range = sheet.getRange(currentrow,1,1,120);
  selectedrow = range.getValues();
  showDialog()
}

// This function is called within the HTML page to display the selected row data to text-area block.
function getRowData(){
  // Return the data for this row and remove any empty cell so we can have all text in one place
  data = "";
  for (i=0; i<selectedrow[0].length;i++){
    if (selectedrow[0][i]!=""){
      data += selectedrow[0][i]+"\n";
    }
  }
  return data;
}

// This function shows a modal with index.html content
function showDialog() {
   var html = HtmlService.createTemplateFromFile('index').evaluate()
   html.setWidth(967);
   html.setHeight(700);
SpreadsheetApp.getUi() 
    .showModalDialog(html, 'Row Data');
}

```

Below is what our super simple `index.html` file content looks like


```html
<html>
<header>
<style>
</style>
</header>
<body>
<textarea id="text" rows="40" style="margin: 0px; width: 100%; height: 100%;">
<?= getRowData() ?>
</textarea>

<br>
<br>
<br>
</body>
</html>
```

That's it!

San