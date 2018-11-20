//
//  default_vs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

attribute vec4 vPosition;
attribute vec2 vTexCoord;

varying vec2 texCoord;

void main()
{
	gl_Position = vPosition;
	texCoord = vTexCoord;
}