var OPENAI_API_KEY = '**'; // Replace with your actual OpenAI API key
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  
  return template.evaluate()
    .setTitle('Web App Window Title')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


function getResponse(message) {
  // Define the sheet names you want to fetch data from
  var sheetNames = ['Team', 'Company', 'Services', 'Data'];
  var data = [];

  // Iterate through each sheet and collect data from columns A to F
  sheetNames.forEach(function(sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (sheet) { // Ensure the sheet exists
      var lastRow = sheet.getLastRow();
      if (lastRow > 0) { // Ensure there is data
        var sheetData = sheet.getRange('A1:F' + lastRow).getValues();
        // Optionally, you can prefix each row with the sheet name for better context
        sheetData.forEach(function(row) {
          data.push(sheetName + ": " + row.join(' '));
        });
      }
    } else {
      Logger.log('Sheet not found: ' + sheetName);
    }
  });

  // Extract keywords from the user message
  var keywords = extractKeywords(message);
  
  // Find relevant data based on extracted keywords
  var relevantData = findRelevantData(data, keywords);
  
  // Construct the system prompt
  var systemPrompt = "You are a helpful assistant knowledgeable about Astoe Company, founded by Mohammad Rameez Imdad. You only answer questions related to Astoe Company & Tech Related.";
  
  if (relevantData.length > 0) {
    systemPrompt += "\nHere is some relevant information:\n" + relevantData.join('\n');
  }
  
  // OpenAI API endpoint
  var url = 'https://api.openai.com/v1/chat/completions';
  
  // Prepare the payload for the API request
  var payload = {
    "model": "gpt-4", 
    "messages": [
      {"role": "system", "content": systemPrompt},
      {"role": "user", "content": message}
    ]
  };

  // Configure the request options
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + OPENAI_API_KEY
    },
    'payload': JSON.stringify(payload)
  };

  try {
    // Make the API request
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());
    
    // Extract the assistant's reply
    var reply = json.choices[0].message.content.trim();
    
    return reply;
  } catch (error) {
    Logger.log('Error fetching response from OpenAI: ' + error);
    return "Sorry, I'm having trouble accessing my knowledge base right now.";
  }
}

function extractKeywords(text) {
  // Convert text to lowercase and split into words, filtering out short words
  return text.toLowerCase().split(/\W+/).filter(function(word) {
    return word.length > 3;
  });
}

function findRelevantData(data, keywords) {
  var relevantRows = [];
  
  data.forEach(function(row) {
    var rowText = row.toLowerCase();
    for (var i = 0; i < keywords.length; i++) {
      if (rowText.indexOf(keywords[i]) !== -1) {
        relevantRows.push(row);
        break; 
      }
    }
  });
  
  return relevantRows;
}
