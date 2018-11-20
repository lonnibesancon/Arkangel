//
//  display_result_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform sampler2D src;
varying vec2 texCoord;

void main()
{
    float alpha = texture2D(src, vec2(texCoord.x, 1.0 - texCoord.y)).a;
	gl_FragColor = vec4(texture2D(img, vec2(texCoord.x, 1.0 - texCoord.y)).rgb, alpha);
}