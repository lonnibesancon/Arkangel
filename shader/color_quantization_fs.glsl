//
//  color_quantization_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform int nbins;
uniform float phiQ;

varying vec2 texCoord;

void main (void) {
    vec3 c = texture2D(img, texCoord).xyz;

    float qn = floor(c.x * float(nbins) + 0.5) / float(nbins);
    float qs = smoothstep(-2.0, 2.0, phiQ * (c.x - qn) * 100.0) - 0.5;
    float qc = qn + qs / float(nbins);

    gl_FragColor = vec4( vec3(qc, c.yz), 1.0 );
}
