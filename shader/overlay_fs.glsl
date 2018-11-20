//
//  overlay_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform sampler2D edges;

varying vec2 texCoord;

void main (void) {
    vec3 c = texture2D(img, texCoord).xyz;
    float e = texture2D(edges, texCoord).x;
    gl_FragColor = vec4(vec3(e * c.x, c.y, c.z), 1.0);
}