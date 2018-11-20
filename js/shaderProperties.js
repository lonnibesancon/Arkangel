//
//  shaderProperties.js
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

"use strict";

var ShaderProperties = new (function(){
	var floatFields =	["sst_sigma", "bf_sigma_d",	"bf_sigma_r",
						"dog_sigma_e", "dog_sigma_r", "dog_sigma_m", "dog_tau", "dog_phi", "dog_epsilon",
						"cq_phi_q", "fs_sigma"];
	var intFields =		["bf_n_e",	"bf_n_a", "dog_n", "cq_nbins", "max_size"];
	var stringFields =	["dog_color", "dog_type", "cq_smoothing", "fs_type"];
	var thisObj = this;

	this.values = [];
	this.onValueChanged = null;
	this.onImageChanged = null;
	this.onResultTypeChanged = null

	function callChangedValue(methodToCall, parameter) {
		if (methodToCall !== null) {
			methodToCall.apply(this, parameter);
		}
	}

	function addResultTypeChangedEvent() {
		thisObj.values["result_type"] = "result";
	}
	
	this.setLoA = function(loa) {
		if(loa == 1) {
			this.values["bf_n_a"] = parseInt(0);
		}
		else if(loa == 2) {
			this.values["bf_n_a"] = parseInt(1);
		}
		else if(loa == 3) {
			this.values["bf_n_a"] = parseInt(3);
		}
		else if(loa == 4) {
			this.values["bf_n_a"] = parseInt(5);
		}
		else if(loa == 5) {
			this.values["bf_n_a"] = parseInt(7);
		}
		else if(loa == 6) {
			this.values["bf_n_a"] = parseInt(10);
		}
		else if(loa == 7) {
			this.values["bf_n_a"] = parseInt(13);
		}
		else if(loa == 8) {
			this.values["bf_n_a"] = parseInt(16);
		}
		else if(loa == 9) {
			this.values["bf_n_a"] = parseInt(20);
		}
	}
	
	this.setEE = function(ee) {
		if(ee == 1) {
			this.values["bf_n_e"] = parseInt(20);
			this.values["dog_tau"] = parseFloat(0.93);
		}
		else if(ee == 2) {
			this.values["bf_n_e"] = parseInt(16);
			this.values["dog_tau"] = parseFloat(0.94);
		}
		else if(ee == 3) {
			this.values["bf_n_e"] = parseInt(13);
			this.values["dog_tau"] = parseFloat(0.95);
		}
		else if(ee == 4) {
			this.values["bf_n_e"] = parseInt(10);
			this.values["dog_tau"] = parseFloat(0.96);
		}
		else if(ee == 5) {
			this.values["bf_n_e"] = parseInt(7);
			this.values["dog_tau"] = parseFloat(0.97);
		}
		else if(ee == 6) {
			this.values["bf_n_e"] = parseInt(5);
			this.values["dog_tau"] = parseFloat(0.98);
		}
		else if(ee == 7) {
			this.values["bf_n_e"] = parseInt(3);
			this.values["dog_tau"] = parseFloat(0.99);
		}
		else if(ee == 8) {
			this.values["bf_n_e"] = parseInt(1);
			this.values["dog_tau"] = parseFloat(0.99);
		}
		else if(ee == 9) {
			this.values["bf_n_e"] = parseInt(0);
			this.values["dog_tau"] = parseFloat(0.99);
		}
	}

	this.init = function() {
		addResultTypeChangedEvent();
		
		this.values["sst_sigma"] = parseFloat(2.0);
		this.values["bf_sigma_d"] = parseFloat(6.0);
		this.values["bf_sigma_r"] = parseFloat(5.25);
		this.values["dog_sigma_e"] = parseFloat(1.0);
		this.values["dog_sigma_r"] = parseFloat(1.6);
		this.values["dog_sigma_m"] = parseFloat(3.0);
		this.values["dog_tau"] = parseFloat(0.99);
		this.values["dog_phi"] = parseFloat(2.0);
		this.values["dog_epsilon"] = parseFloat(0.0);
		this.values["cq_phi_q"] = parseFloat(2.0);
		this.values["fs_sigma"] = parseFloat(1.0);
		
		this.values["bf_n_e"] = parseInt(1);
		this.values["bf_n_a"] = parseInt(3);
		this.values["dog_n"] = parseInt(1);
		this.values["cq_nbins"] = parseInt(8);
		this.values["max_size"] = parseInt(1024);
		this.values["default_size"] = parseFloat(1024.0);
		
		this.values["dog_color"] = "#000000";
		this.values["dog_type"] = "FDoG";
		this.values["cq_smoothing"] = "3x3";
		this.values["fs_type"] = "3x3";
		
	};
})();

//$(document).ready( function(){ ShaderProperties.init(); });