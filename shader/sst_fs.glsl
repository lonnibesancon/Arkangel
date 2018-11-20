//
//  sst_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
varying vec2 texCoord;
uniform vec2 imgSize;

void main() {
    vec2 d = 1.0 / imgSize;

    vec4 u = (
             -1.0 * texture2D(img, texCoord + vec2(-d.x, -d.y)) +
             -2.0 * texture2D(img, texCoord + vec2(-d.x,  0.0)) +
             -1.0 * texture2D(img, texCoord + vec2(-d.x,  d.y)) +
             +1.0 * texture2D(img, texCoord + vec2( d.x, -d.y)) +
             +2.0 * texture2D(img, texCoord + vec2( d.x,  0.0)) +
             +1.0 * texture2D(img, texCoord + vec2( d.x,  d.y))
             ) / 4.0;

    vec4 v = (
             -1.0 * texture2D(img, texCoord + vec2(-d.x, -d.y)) +
             -2.0 * texture2D(img, texCoord + vec2( 0.0, -d.y)) +
             -1.0 * texture2D(img, texCoord + vec2( d.x, -d.y)) +
             +1.0 * texture2D(img, texCoord + vec2(-d.x,  d.y)) +
             +2.0 * texture2D(img, texCoord + vec2( 0.0,  d.y)) +
             +1.0 * texture2D(img, texCoord + vec2( d.x,  d.y))
             ) / 4.0;

	vec3 st = vec3(dot(u.xyz, u.xyz), dot(v.xyz, v.xyz), dot(u.xyz, v.xyz)) / 3.0;
	st = sign(st)*sqrt(abs(st));
	st = 0.5 + st * 0.5;

    gl_FragColor = vec4(st, 1.0);
}

