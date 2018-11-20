//
//  webgl.js
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

"use strict";

/**
 * Class ShaderLoader
 *
 * Load external source code of a shader, compile it and cache it.
 */
function ShaderLoader(glContext) {
	var shaderSourceCache = [];
	var vertexCache = [];
	var fragmentCache = [];
	var gl = glContext;

	/**
	 * Try to load a external ressource
	 *
	 * @param string Name of shader file (path and file extension are added automatically)
	 * @return string Source code of shader or empty string
	 */
	function getExternalSource(shaderName){
		if(typeof(shaderSourceCache[shaderName]) == "undefined") {
			var shaderUrl = "shader/" + shaderName + ".glsl";
			var shaderUrlExt = chrome.extension.getURL(shaderUrl);
			console.log("loading shader: " + shaderUrlExt);
			
			var req = new XMLHttpRequest();
			req.open("GET", shaderUrlExt, false);
			req.send(null);
			shaderSourceCache[shaderName] = (req.readyState == 4 && req.status == 200) ? req.responseText : "";
			
		}
		return shaderSourceCache[shaderName];
	}

	/**
	 * Compile shader
	 *
	 * @param int Type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
	 * @param string Source code of shader
	 * @param string Name of shader, which will be displayed in case of an error on console
	 * @return WebGLShader Compiled shader or null in case of an error
	 */
	function compileShader(shaderType, sourcecode, shaderName){
		var shader = gl.createShader(shaderType);
		gl.shaderSource(shader, sourcecode);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("An error occurred compiling the shader (" + shaderName + "): " + gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}

	/**
	 * Replace place holder in source code of a shader and compile it after this
	 *
	 * @param GLint Type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
	 * @param string Name of shader, which should be loaded and compiled
	 * @param object List of place holder replacement strings (key->value)
	 * @return WebGLShader Compiled shader or null in case of an error
	 */
	function getCompiledModifiedShader(shaderType, shaderName, modifiedParameter){
			var sourcecode = getExternalSource(shaderName);
			$.each(modifiedParameter, function(varName, value) {
				//javascript don't support an better way to replace global without regex
				sourcecode = sourcecode.split("$"+varName+"$").join(value);
			});
			return compileShader(shaderType, sourcecode, shaderName);
	}

	return {
		/**
		 * Compile a vertex shader.
		 * In case modifiedParameter is an empty object, the compiled shader will be cached.
		 *
		 * @param string Name of shader, which should be loaded and compiled
		 * @param object List of place holder replacement strings (key->value)
		 * @return WebGLShader Compiled shader or null in case of an error
		 */
		getVertexShader: function(shaderName, modifiedParameter) {
			if (Object.keys(modifiedParameter).length === 0) {
				if(!vertexCache[shaderName]) {
					var sourcecode = getExternalSource(shaderName);
					vertexCache[shaderName] = compileShader(gl.VERTEX_SHADER, sourcecode, shaderName);
				}
				return vertexCache[shaderName];
			}
			return getCompiledModifiedShader(gl.VERTEX_SHADER, shaderName, modifiedParameter);
		},

		/**
		 * Compile a fragment shader.
		 * In case modifiedParameter is an empty object, the compiled shader will be cached.
		 *
		 * @param string Name of shader, which should be loaded and compiled
		 * @param object List of place holder replacement strings (key->value)
		 * @return WebGLShader Compiled shader or null in case of an error
		 */
		getFragmentShader: function(shaderName, modifiedParameter) {
			if (Object.keys(modifiedParameter).length === 0) {
				if(!fragmentCache[shaderName]) {
					var sourcecode = getExternalSource(shaderName);
					fragmentCache[shaderName] = compileShader(gl.FRAGMENT_SHADER, sourcecode, shaderName);
				}
				return fragmentCache[shaderName];
			}
			return getCompiledModifiedShader(gl.FRAGMENT_SHADER, shaderName, modifiedParameter);
		}
	};
}

/**
 * Class TextureManager
 *
 * Create textures and provide simple methods for this textures
 */
function TextureManager(glContext){
	var gl = glContext;
	var thisObj = this;
	var lastImage = null;
	var cachedTexture = null;
	var lastMaxSize = -1;
	var orginalImageSize = {width: 0, height: 0};

	this.textureWidth = 0;
	this.textureHeight = 0;

	/**
	 * Create an empty texture and set default settings
	 *
	 * @return WebGLTexture Created texture
	 */
	function createTexture(){
		var newTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, newTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		return newTexture;
	}

	/**
	 * Check if image must be downscaled and do it if necesessary.
	 *
	 * @param HTMLImageElement The image to downscale
	 * @param int Maximum with or height of image
	 */
	this.downscaleImage = function(image, maxSize) {
		var w = orginalImageSize.width;
		var h = orginalImageSize.height;

		image.width = w;
		image.height = h;

		if (maxSize > 0) {
			if (w > h) {
				if (w > maxSize) {
					image.height = maxSize * h/w;
					image.width = maxSize;
				}
			} else {
				if (h > maxSize) {
					image.width = maxSize * w/h;
					image.height = maxSize;
				}
			}
		}
		
		image.height = maxSize;
		image.width = maxSize;
	}

	/**
	 * Call callback function that image is loaded and set lastMaxSize to an
	 * invalid value to make sure, that not the last cached texture will be returned in
	 * Before it will be binded, it will be downscaled if necessary.
	 * After this call the callback function onReadyCallback.
	 *
	 * @param HTMLImageElement The source image
	 * @param function The callback function.
	 */
	this.imageLoaded = function(image, onReadyCallback) {
		cachedTexture = null;
		lastImage = image;
		orginalImageSize = {width: image.naturalWidth, height: image.naturalHeight}
		onReadyCallback();
	}

	/**
	 * Return texture of last loaded image. In case maximum size don't have changed,
	 * return prevent uploading to gpu;
	 *
	 * @return WebGLTexture Return downscaled texture of image or null, if no image is loaded
	 */
	this.getLastImageTexture = function() {
		if (lastImage === null) {
			return null;
		}

		var maxSize = ShaderProperties.values["max_size"];
		if ((cachedTexture !== null) && (lastMaxSize == maxSize)) {
			//return cachedTexture;
		}
		
		var w = orginalImageSize.width;
		var h = orginalImageSize.height;

		if (maxSize > 0) {
			if (w > h) {
				if (w > maxSize) {
					thisObj.textureWidth = maxSize;
					thisObj.textureHeight = maxSize;
				}
				else {
					thisObj.textureWidth = w;
					thisObj.textureHeight = w;
				}
			} else {
				if (h > maxSize) {
					thisObj.textureWidth = maxSize;
					thisObj.textureHeight = maxSize;
				}
				else {
					thisObj.textureWidth = h;
					thisObj.textureHeight = h;
				}
			}
		}
		
		//this.downscaleImage(lastImage, maxSize);
		lastMaxSize = maxSize;

		var texture = createTexture();
		try {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lastImage);
		} catch (error) {
			console.log("Unable to process image");
			return 0;
		}
		return texture;
	}

	/**
	 * Load an image asynchronous and call onReadyCallback if it is finsihed.
	 *
	 * @param string Url of the image
	 * @param function The callback function.
	 */
	this.loadImage = function(imageUrl, onReadyCallback) {
		var image = new Image();
		image.onload = function() { imageLoaded(image, onReadyCallback); };
		image.src = imageUrl;
	};

	/**
	 * Load a image from local disc asynchronous and call onReadyCallback if it is finsihed.
	 *
	 * @param string Path to local image
	 * @param function The callback function.
	 */
	this.loadLocalImage = function(image, onReadyCallback) {
		/*
		var image = new Image();
		var fileReader = new FileReader();
		fileReader.readAsDataURL(localImagePath);
		image.onload = function() { imageLoaded(image, onReadyCallback); };
		fileReader.onload = function (readerEvent) {
			image.src = readerEvent.target.result;
		};
		*/
		
		imageLoaded(image, onReadyCallback);
	};

	/**
	 * Create an texture and set dimension to size of last loaded image.
	 *
	 * @return WebGLTexture Created texture with dimension of last loaded image.
	 */
	this.getTextureWithLastDimension = function() {
		var texture = createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, thisObj.textureWidth, thisObj.textureHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		return texture;
	};


	/**
	 * Change filter type of a texture
	 *
	 * @param GLint filter type
	 */
	this.changeFilter = function(texture, filterType) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
	};
}

/**
 * Class ShaderProgramBase
 *
 * Provides a general methods as program base for shader classes.
 *
 * @param WebGLRenderingContext Rendering context of WebGL
 * @param ShaderLoader Loader to load a shader
 * @param TextureManager Manager to load textures
 */
function ShaderProgramBase(glContext, shaderLoaderInstance, textureManagerInstance) {
	var gl = glContext;
	var shaderLoader = shaderLoaderInstance;
	var vertexPosBuffer = null;
	var textureCoordBuffer = null;

	this.vShader = null;
	this.fShader = null;
	this.lastVetexShaderSourceParameter = {};
	this.lastFragmentShaderSourceParameter = {};

	this.framebuffer = gl.createFramebuffer();
	this.textureManager = textureManagerInstance;
	this.shaderProgram = null;
	this.vertexAttribLoc = null;
	this.textureCoordAttribLoc = null;
	this.vertexShaderName = "default_vs";
	this.fragmentShaderName = "default_fs";

	this.glContext = function() {return gl;};
	this.getVertexShaderSourceParameter = function(shaderParameter) { return {}; };
	this.getFragmentShaderSourceParameter = function(shaderParameter) { return {}; };

	/**
	 * Compare content of two objects (non-recursive!)
	 *
	 * @param object First object to compare
	 * @param object Second object to compare
	 * @return bool True if objects are equeal; else False
	 */
	function objectsAreEqual(a, b) {
		if (Object.keys(a).length != Object.keys(b).length) {
			return false;
		}

		var isEqual = true;
		$.each(a, function(index, value) {
			if (b[index] !== value) {
				isEqual = false;
				return false;
			}
		});
		return isEqual;
	}

	/**
	 * Create a shader program with given parameter.
	 * In case parameter don't have changed, old program or shader will be used.
	 *
	 * @param object List of place holder replacement strings (key->value)
	 */
	this.createProgram = function(shaderParameter){
		//only recompile shaders if parameter has changed

		var needToRelink = false;
		var newParameter = this.getVertexShaderSourceParameter(shaderParameter);
		if ((this.vShader === null) || !objectsAreEqual(this.lastVetexShaderSourceParameter, newParameter)) {
			this.lastVetexShaderSourceParameter = newParameter;
			this.vShader = shaderLoader.getVertexShader(this.vertexShaderName, newParameter);
			needToRelink = true;
		}
		newParameter = this.getFragmentShaderSourceParameter(shaderParameter);
		if ((this.fShader === null) || !objectsAreEqual(this.lastFragmentShaderSourceParameter, newParameter)) {
			this.lastFragmentShaderSourceParameter = newParameter;
			this.fShader = shaderLoader.getFragmentShader(this.fragmentShaderName, newParameter);
			needToRelink = true;
		}

		if ((this.vShader === null) || (this.fShader === null)) {
			return;
		}
		if (needToRelink) {
			this.shaderProgram = gl.createProgram();
			gl.attachShader(this.shaderProgram, this.vShader);
			gl.attachShader(this.shaderProgram, this.fShader);

			gl.linkProgram(this.shaderProgram);
			if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
				console.error("Could not initialise shader program: " + gl.getProgramInfoLog(this.shaderProgram));
			}

			this.vertexAttribLoc = this.enableVertexAttribArray("vPosition");
			this.textureCoordAttribLoc = this.enableVertexAttribArray("vTexCoord");
		}
	};

	/**
	 * Test if the shader can be bypassed, if possible.
	 * This save performance and prefent some shader failures (loops with zero iterations)
	 *
	 * @param object List of place holder replacement strings (key->value)
	 * @return bool True, if shader can be passed; else False
	 */
	this.byPassShader = function(shaderParameter){ return false; };

	this.renderToTexture = function(texture, shaderParameter){
		if (this.byPassShader(shaderParameter)) {
			return texture;
		}

		var resultTexture = this.textureManager.getTextureWithLastDimension();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resultTexture, 0);

		this.render(texture, shaderParameter);
		return resultTexture;
	};
	this.setShaderVariables = function(shaderParameter) {};

	this.executeShader = function(texture, shaderParameter) {
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};

	this.renderToDisplay = function(texture, shaderParameter){
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.render(texture, shaderParameter);
	};

	this.render = function(texture, shaderParameter) {
		this.createProgram(shaderParameter);

		if (this.shaderProgram === null) {
			return;
		}

		gl.useProgram(this.shaderProgram);

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		this.vertexAttribPointer(this.vertexAttribLoc, vertexPosBuffer, 3);
		this.vertexAttribPointer(this.textureCoordAttribLoc, textureCoordBuffer, 2);
		this.uniform1i("img", 0);

		this.setShaderVariables(shaderParameter);
		this.executeShader(texture, shaderParameter);
	};

	this.uniform1i = function(name, value1) {
		var loc = gl.getUniformLocation(this.shaderProgram, name);
		if (loc === null) {
			console.warn('Location of uniform "'+ name +'" not found!');
			return;
		}
		gl.uniform1i(loc, value1);
	};

	this.uniform1f = function(name, value1) {
		var loc = gl.getUniformLocation(this.shaderProgram, name);
		if (loc === null) {
			console.warn('Location of uniform "'+ name +'" not found!');
			return;
		}
		gl.uniform1f(loc, value1);
	};

	this.uniform2f = function(name, value1, value2) {
		var loc = gl.getUniformLocation(this.shaderProgram, name);
		if (loc === null) {
			console.warn('Location of uniform "'+ name +'" not found!');
			return;
		}
		gl.uniform2f(loc, value1, value2);
	};

	this.uniform3f = function(name, value1, value2, value3) {
		var loc = gl.getUniformLocation(this.shaderProgram, name);
		if (loc === null) {
			console.warn('Location of uniform "'+ name +'" not found!');
			return;
		}
		gl.uniform3f(loc, value1, value2, value3);
	};

	this.enableVertexAttribArray = function(name) {
		var loc = gl.getAttribLocation(this.shaderProgram, name);
		if (loc == -1) {
			console.warn('Location of attribute "'+ name +'" not found!');
			return -1;
		}
		gl.enableVertexAttribArray(loc);
		return loc;
	};

	this.vertexAttribPointer = function(loc, buffer, size) {
		if (loc == -1) {
			console.warn('Invalid location value!');
			return;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
	};

	function initBuffers(){
		//add quad
		vertexPosBuffer = gl.createBuffer();
		var vertices = new Float32Array([
			 1.0, -1.0, 0.0,
			-1.0, -1.0, 0.0,
			 1.0,  1.0, 0.0,
			-1.0,  1.0, 0.0 ]);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		//add texture coordinates
		textureCoordBuffer = gl.createBuffer();
		var textureCoordinates = new Float32Array([
			1.0,  0.0,
			0.0,  0.0,
			1.0,  1.0,
			0.0,  1.0 ]);
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	initBuffers();
}

function resolutionScale(textureManager, value) {
	return value * (Math.max(textureManager.textureWidth, textureManager.textureHeight) / ShaderProperties.values["default_size"]);
}

function Rgb2LabProgram(){
	this.fragmentShaderName = "rgb2lab_fs";
}

function Lab2RgbProgram(){
	this.fragmentShaderName = "lab2rgb_fs";
}

function GaussProgram(){
	this.fragmentShaderName = "gauss1d_fs";

	this.byPassShader = function(shaderParameter) {
		return Math.ceil(2.0 * ShaderProperties.values["sst_sigma"]) <= 0;
	};

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * resolutionScale(this.textureManager, ShaderProperties.values["sst_sigma"]))};
	};

	this.setShaderVariables = function(horizontal){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigma", ShaderProperties.values["sst_sigma"]);
		this.uniform1f("horizontal", horizontal);
	};
}

function Gauss3x3Program(){
	this.fragmentShaderName = "gauss3x3_fs";

	this.setShaderVariables = function(shaderParameter){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
	};
}

function Gauss5x5Program(){
	this.fragmentShaderName = "gauss5x5_fs";

	this.setShaderVariables = function(shaderParameter){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
	};
}

function SstProgram(){
	this.fragmentShaderName = "sst_fs";

	this.setShaderVariables = function(shaderParameter){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
	};
}

function TfmProgram(){
	this.fragmentShaderName = "tfm_fs";
}

function DoGProgram(){
	this.fragmentShaderName = "dog_fs";

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * ShaderProperties.values["dog_sigma_r"])};
	};

	this.setShaderVariables = function(shaderParameter){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigmaE", ShaderProperties.values["dog_sigma_e"]);
		this.uniform1f("sigmaR", ShaderProperties.values["dog_sigma_r"]);
		this.uniform1f("tau", ShaderProperties.values["dog_tau"]);
		this.uniform1f("phi", ShaderProperties.values["dog_phi"]);
	};
}

function FDoG0Program(){
	this.fragmentShaderName = "fdog0_fs";

	var gl = this.glContext();

	this.byPassShader = function(shaderParameter) {
		return Math.ceil(2.0 * ShaderProperties.values["dog_sigma_r"]) <= 0;
	};

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * ShaderProperties.values["dog_sigma_r"])};
	};

	this.setShaderVariables = function(tfmTexture){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigmaE", ShaderProperties.values["dog_sigma_e"]);
		this.uniform1f("sigmaR", ShaderProperties.values["dog_sigma_r"]);
		this.uniform1f("tau", ShaderProperties.values["dog_tau"]);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, tfmTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("tfm", 1);
	};
}

function FDoG1Program(){
	this.fragmentShaderName = "fdog1_fs";

	var gl = this.glContext();

	this.byPassShader = function(shaderParameter) {
		return Math.ceil(2.0 * ShaderProperties.values["dog_sigma_m"]) <= 0;
	};

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * ShaderProperties.values["dog_sigma_m"])};
	};

	this.setShaderVariables = function(tfmTexture){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigmaM", ShaderProperties.values["dog_sigma_m"]);
		this.uniform1f("phi", ShaderProperties.values["dog_phi"]);
		this.uniform1f("epsilon", ShaderProperties.values["dog_epsilon"]);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, tfmTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("tfm", 1);
	};
}

function OverlayProgram(){
	this.fragmentShaderName = "overlay_fs";

	var gl = this.glContext();

	this.setShaderVariables = function(edgeTexture){
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("edges", 1);
	};
}

function MixProgram(){
	this.fragmentShaderName = "mix_fs";

	var gl = this.glContext();

	this.setShaderVariables = function(edgeTexture){
		var color = $.Color(ShaderProperties.values["dog_color"]);
		this.uniform3f("edgeColor", color.red()/255, color.green()/255, color.blue()/255);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("edges", 1);
	};
}

function ColorQuantizationProgram(){
	this.fragmentShaderName = "color_quantization_fs";

	this.setShaderVariables = function(shaderParameter){
		this.uniform1i("nbins", ShaderProperties.values["cq_nbins"]);
		this.uniform1f("phiQ", ShaderProperties.values["cq_phi_q"]);
	};
}

function LicProgram(){
	this.fragmentShaderName = "lic_fs";

	var gl = this.glContext();

	this.byPassShader = function(shaderParameter) {
		return Math.ceil(2.0 * ShaderProperties.values["fs_sigma"]) <= 0;
	};

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * ShaderProperties.values["fs_sigma"])};
	};

	this.setShaderVariables = function(tfmTexture){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigma", ShaderProperties.values["fs_sigma"]);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, tfmTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("tfm", 1);
	};
}

function OrientationAlignedBilateralFilterProgram(){
	this.fragmentShaderName = "bf_fs";

	var gl = this.glContext();

	this.byPassShader = function(shaderParameter) {
		return (shaderParameter.n <= 0) || (Math.ceil(2.0 * ShaderProperties.values["bf_sigma_d"]) <= 0);
	};

	this.getFragmentShaderSourceParameter = function(shaderParameter) {
		return {"halfWidth": Math.ceil(2.0 * ShaderProperties.values["bf_sigma_d"])};
	};

	this.setShaderVariables = function(bfParams){
		this.uniform2f("imgSize", this.textureManager.textureWidth, this.textureManager.textureHeight);
		this.uniform1f("sigmaD", resolutionScale(this.textureManager, ShaderProperties.values["bf_sigma_d"]));
		this.uniform1f("sigmaR", ShaderProperties.values["bf_sigma_r"] / 100);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, bfParams.tfmTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("tfm", 1);
	};

	this.executeShader = function(srcTexture, shaderParameter) {
		var resultTexture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
		var tmpTexture = this.textureManager.getTextureWithLastDimension();
		var dstTexture = this.textureManager.getTextureWithLastDimension();
		this.textureManager.changeFilter(tmpTexture, gl.LINEAR);
		this.textureManager.changeFilter(dstTexture, gl.LINEAR);
		this.textureManager.changeFilter(srcTexture, gl.LINEAR);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

		for (var i = 0; i < shaderParameter.n; i++) {
			gl.bindTexture(gl.TEXTURE_2D, (i === 0) ? srcTexture : dstTexture);
			this.uniform1i("pass", 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tmpTexture, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			gl.bindTexture(gl.TEXTURE_2D, tmpTexture);
			this.uniform1i("pass", 1);
			if (i == shaderParameter.n - 1) {
				if (resultTexture !== null)
				{
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resultTexture, 0);
				}
				else
				{
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				}
			} else {
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTexture, 0);
			}
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
	};
}

function DisplayResultProgram(){
	this.fragmentShaderName = "display_result_fs";

	var gl = this.glContext();

	this.setShaderVariables = function(shaderParameter) {
		var texW = this.textureManager.textureWidth;
		var texH = this.textureManager.textureHeight;

		var vertices;
		if (texW > texH) {
			var height = texH/texW;
			vertices = new Float32Array([
				 1.0, -height, 0.0,
				-1.0, -height, 0.0,
				 1.0,  height, 0.0,
				-1.0,  height, 0.0 ]);
		} else {
			var width = texW/texH;
			vertices = new Float32Array([
				 width, -1.0, 0.0,
				-width, -1.0, 0.0,
				 width,  1.0, 0.0,
				-width,  1.0, 0.0 ]);
		}

		var resultVertexPosBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, resultVertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		this.vertexAttribPointer(this.vertexAttribLoc, resultVertexPosBuffer, 3);
		
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, shaderParameter.srcTexture);
		gl.activeTexture(gl.TEXTURE0);
		this.uniform1i("src", 1);
	};

	this.executeShader = function(texture, shaderParameter) {
		this.textureManager.changeFilter(texture, gl.LINEAR);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};
}

/**
 * Class WebGLFilter
 *
 * Create rendering context and initialize and run rendering engine
 */
var WebGLFilter = function() {
	var gl = null;
	var canvas = document.createElement('canvas');
	var srcTexture    = null;
	var srcTextureMaxDimensionSize = 0;
	var textureManager = null;
	var readyToRender = false;
	var shadersReady = false;

	var shaderPrograms = [];
	var resultTextures = [];

	/**
	 * Try to get a WebGL context from canvas
	 *
	 * @param HTMLCanvasElement Canvas element as target of WebGL
	 **/
	function initContext() {
		gl = null;
		try {
			gl = canvas.getContext("webgl");
		}
		catch(e) {
		}

		if (!gl) {
			try {
				gl = canvas.getContext("experimental-webgl");
			}
			catch(e) {
			}
		}

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser may not support it.");
		}
	}

	/**
	 * Setup the WebGL context (enable cull_face, textures and set clear color to black)
	 **/
	function setupContext(){
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		//we only need one texture at same time, so we set this value fix
		gl.activeTexture(gl.TEXTURE0);
	}

	/**
	 * Create an instance of a class and set prototype of this class to base instance.
	 *
	 * @param object Instance of base class
	 * @param class Class object, which should be created and linked to base class
	 * @return object Instance of created class
	 */
	function createShaderProgramInstance(baseInstance, childClass){
		childClass.prototype = baseInstance;
		childClass.prototype.constructor = childClass;
		return new childClass();
	}


	/**
	 * Create all shader programs and try to start the rendering engine after this.
	 */
	function createShaderPrograms(){
		var shaderLoader = new ShaderLoader(gl);
		var shaderProgramBase = new ShaderProgramBase(gl, shaderLoader, textureManager);

		var shaderProgramList = {
			"rgb2Lab":			Rgb2LabProgram,
			"lab2Rgb":			Lab2RgbProgram,
			"gauss":			GaussProgram,
			"gauss3x3":			Gauss3x3Program,
			"gauss5x5":			Gauss5x5Program,
			"displayResult":	DisplayResultProgram,
			"sst":				SstProgram,
			"tfm":				TfmProgram,
			"bf":				OrientationAlignedBilateralFilterProgram,
			"dog":				DoGProgram,
			"fdog0":			FDoG0Program,
			"fdog1":			FDoG1Program,
			"overlay":			OverlayProgram,
			"color":			ColorQuantizationProgram,
			"mix":				MixProgram,
			"lic":				LicProgram
		};
		$.each(shaderProgramList, function(index, programName) {
			shaderPrograms[index] = createShaderProgramInstance(shaderProgramBase, programName);
		});
		shadersReady = true;
		drawScene();
	}

	function fDoGFilter(srcTexture, tfmTexture){
		textureManager.changeFilter(srcTexture, gl.LINEAR);
		textureManager.changeFilter(tfmTexture, gl.NEAREST);
		 for (var i = 0; i < ShaderProperties.values["dog_n"]; i++) {
		 	var inputTexture;
		 	var dstTexture;

		 	if (i === 0) {
		 		inputTexture = srcTexture;
		 	} else {
		 		inputTexture = shaderPrograms["overlay"].renderToTexture(srcTexture, dstTexture);
		 	}

		 	dstTexture = shaderPrograms["fdog0"].renderToTexture(inputTexture, tfmTexture);
		 	dstTexture = shaderPrograms["fdog1"].renderToTexture(dstTexture, tfmTexture);
		 }

		return dstTexture;
	}

	function drawScene() {
		var inputTexture = textureManager.getLastImageTexture();
		
		if(inputTexture == 0) {
			return;
		}
		
		resultTextures["srcTexture"] = inputTexture;

		if ((resultTextures["srcTexture"] === null) || !shadersReady) {
			return;
		}

		var startTime = new Date();

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, textureManager.textureWidth, textureManager.textureHeight);

		var tmpTexture = null;
		var labTexture = shaderPrograms["rgb2Lab"].renderToTexture(resultTextures["srcTexture"]);

		var sstTexture = shaderPrograms["sst"].renderToTexture(resultTextures["srcTexture"], null);
		tmpTexture = shaderPrograms["gauss"].renderToTexture(sstTexture, false);
		tmpTexture = shaderPrograms["gauss"].renderToTexture(tmpTexture, true);
		var tfmTexture = shaderPrograms["tfm"].renderToTexture(tmpTexture, null);
		var bfeTexture = (ShaderProperties.values["bf_n_e"] > 0) ? shaderPrograms["bf"].renderToTexture(labTexture, {"tfmTexture": tfmTexture, "n": ShaderProperties.values["bf_n_e"]}) : labTexture;
		var bfaTexture = (ShaderProperties.values["bf_n_a"] > 0) ? shaderPrograms["bf"].renderToTexture(labTexture, {"tfmTexture": tfmTexture, "n": ShaderProperties.values["bf_n_a"]}) : labTexture;

		resultTextures["edgesTexture"] = (ShaderProperties.values["dog_type"] == "FDoG")
			? fDoGFilter(bfeTexture, tfmTexture)
			: shaderPrograms["dog"].renderToTexture(bfeTexture, null);

		var cqTexture = shaderPrograms["color"].renderToTexture(bfaTexture, null);
		if (ShaderProperties.values["cq_smoothing"] == "3x3") {
			cqTexture = shaderPrograms["gauss3x3"].renderToTexture(cqTexture, null);
		} else if (ShaderProperties.values["cq_smoothing"] == "5x5") {
			cqTexture = shaderPrograms["gauss5x5"].renderToTexture(cqTexture, null);
		}
		resultTextures["cqRgbTexture"] = shaderPrograms["lab2Rgb"].renderToTexture(cqTexture, null);

		var ovTexture = shaderPrograms["mix"].renderToTexture(resultTextures["cqRgbTexture"], resultTextures["edgesTexture"]);

		switch(ShaderProperties.values["fs_type"]){
			case "3x3":
				resultTextures["resultTexture"] = shaderPrograms["gauss3x3"].renderToTexture(ovTexture, null);
				break;
			case "5x5":
				resultTextures["resultTexture"] = shaderPrograms["gauss5x5"].renderToTexture(ovTexture, null);
				break;
			case "flow":
				resultTextures["resultTexture"] = shaderPrograms["lic"].renderToTexture(ovTexture, tfmTexture);
				break;
			default:
				resultTextures["resultTexture"] = ovTexture;
		}

		resultTextures["bfNETexture"] = shaderPrograms["lab2Rgb"].renderToTexture(bfeTexture, null);
		resultTextures["bfNATexture"] = shaderPrograms["lab2Rgb"].renderToTexture(bfaTexture, null);

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

		displayResult();

		var renderTime = (new Date) - startTime;
		//console.log("Render time: " + renderTime);
	}

	function displayResult() {
		if (Object.keys(resultTextures).length > 0) {
			var displayTexture = null;
			switch(ShaderProperties.values["result_type"]){
				case "original":
					displayTexture = resultTextures["srcTexture"];
					break;
				case "bf_n_e":
					displayTexture = resultTextures["bfNETexture"];
					break;
				case "bf_n_a":
					displayTexture = resultTextures["bfNATexture"];
					break;
				case "dog":
					displayTexture = resultTextures["edgesTexture"];
					break;
				case "cq":
					displayTexture = resultTextures["cqRgbTexture"];
					break;
				default:
					displayTexture = resultTextures["resultTexture"];
			}

			shaderPrograms["displayResult"].renderToDisplay(displayTexture, {"srcTexture": resultTextures["srcTexture"]});

			gl.flush();
		}
	}
	
	this.filter = function(image) {
		if(image.naturalWidth == 0 || image.naturalHeight == 0) {
			// the passed image is not valid, thus return an empty canvas
			return document.createElement('canvas');
		}
		
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		
		textureManager.imageLoaded(image, drawScene);

		//console.log("W: " + textureManager.textureWidth);
		//console.log("H: " + textureManager.textureHeight);
		
		return canvas;
	}

	initContext();
	if (!gl) {
		return;
	}
	setupContext();
	textureManager = new TextureManager(gl);
	createShaderPrograms();
}
