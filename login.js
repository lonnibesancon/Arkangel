//
//  login.js
//  Arkangel
//
//  Contributors: Amir Semmo, Lonni Besançon
//  Copyright (c) 2018 Hasso Plattner Institute, Linköping University and Digital Masterpieces GmbH.
//  All rights reserved.
//

'use strict';

let changeColor = document.getElementById('changeColor');
chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
    let color = element.target.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
          tabs[0].id,
          {code: 'document.body.style.backgroundColor = "' + color + '";'});
    });
};