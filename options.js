//
//  options.js
//  Arkangel
//
//  Contributors: Amir Semmo, Lonni Besançon
//  Copyright (c) 2018 Hasso Plattner Institute, Linköping University and Digital Masterpieces GmbH.
//  All rights reserved.
//

let slider_loa = document.getElementById("loa_range");
let output_loa = document.getElementById("loa_value");
output_loa.innerHTML = slider_loa.value;

slider_loa.oninput = function() {
	output_loa.innerHTML = this.value;
	chrome.storage.sync.set({'loa': this.value});
}

let slider_ee = document.getElementById("ee_range");
let output_ee = document.getElementById("ee_value");
output_ee.innerHTML = slider_ee.value;

slider_ee.oninput = function() {
	output_ee.innerHTML = this.value;
	chrome.storage.sync.set({'ee': this.value});
}

function restore_options() {
  // Use default values loa = 3, ee = 7
  chrome.storage.sync.get({
    loa: 3,
    ee: 7
  }, function(items) {
	  output_loa.innerHTML = items.loa;
	  slider_loa.value = items.loa;
	  output_ee.innerHTML = items.ee;
	  slider_ee.value = items.ee;
	  // force triggering update
	  //chrome.storage.sync.set({'loa': items.loa, 'ee': items.ee});
  });
}

document.addEventListener('DOMContentLoaded', restore_options);