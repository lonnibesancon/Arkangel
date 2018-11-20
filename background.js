//
//  background.js
//  Arkangel
//
//  Contributors: Amir Semmo, Lonni Besançon
//  Copyright (c) 2018 Hasso Plattner Institute, Linköping University and Digital Masterpieces GmbH.
//  All rights reserved.
//

'use strict';

var loa = 3;
var ee = 7;

ShaderProperties.init();
var webglfilter_ = new WebGLFilter();

function filterImageKernel(src, sendResponse) {
	var image = new Image();
	
	image.onload = function() {
			var filteredImage = webglfilter_.filter(image);
			var d = filteredImage.toDataURL("image/png");
			sendResponse(d);
    };
	
	image.crossOrigin = "anonymous";
	image.src = src;
}


function onMessage(request, sender, sendResponse) {
	if (request.action == 'filterImageKernel') {
		filterImageKernel(request.src, sendResponse);
	}
	return true; 
}

chrome.extension.onMessage.addListener(onMessage);

chrome.contextMenus.removeAll(function() {
	chrome.contextMenus.create({
		id: "show-original",
		"title": "Show Original Image",
		"contexts": ["image"]
	});
});
  
chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId == "show-original") {
		if (info.mediaType === "image") {
			chrome.tabs.sendMessage(tab.id, {"action": "imageShowOriginal"}); 
		}		
	}
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
	if('loa' in changes) {
		loa = changes['loa'].newValue;
		ShaderProperties.setLoA(loa);
		console.log("LoA changed to: " + loa);
	}
	if('ee' in changes) {
		ee = changes['ee'].newValue;
		ShaderProperties.setEE(ee);
		console.log("EE changed to: " + ee);
	}
});

function restore_options() {
  // Use default values loa = 3, ee = 7
  chrome.storage.sync.get({
    loa: 3,
    ee: 7
  }, function(items) {
	  ShaderProperties.setLoA(items.loa);
	  ShaderProperties.setEE(items.ee);
  });
}

restore_options();
