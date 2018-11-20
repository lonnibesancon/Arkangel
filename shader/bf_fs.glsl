//
//  bf_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform sampler2D tfm;
uniform int pass;
uniform float sigmaD;
uniform float sigmaR;
uniform vec2 imgSize;
varying vec2 texCoord;

void main (void) {
    float twoSigmaD2 = 2.0 * sigmaD * sigmaD;
    float twoSigmaR2 = 2.0 * sigmaR * sigmaR;

    vec2 t = (texture2D(tfm, texCoord).xy - 0.5) * 2.0;
    vec2 dir = (pass == 0)? vec2(t.y, -t.x) : t;
    vec2 dabs = abs(dir);
    float ds = 1.0 / ((dabs.x > dabs.y)? dabs.x : dabs.y);
    dir /= imgSize;

    vec3 center = texture2D(img, texCoord).rgb;
    vec3 sum = center;
    float norm = 1.0;
	for (int i = 0; i < $halfWidth$; i++) {
		float d = float(i) * ds;
		vec3 c0 = texture2D(img, texCoord + d * dir).rgb;
		vec3 c1 = texture2D(img, texCoord - d * dir).rgb;
		float e0 = length(c0 - center);
		float e1 = length(c1 - center);

		float kerneld = exp( - d *d / twoSigmaD2 );
		float kernele0 = exp( - e0 *e0 / twoSigmaR2 );
		float kernele1 = exp( - e1 *e1 / twoSigmaR2 );
		norm += kerneld * kernele0;
		norm += kerneld * kernele1;

		sum += kerneld * kernele0 * c0;
		sum += kerneld * kernele1 * c1;
	}
    sum /= norm;
    gl_FragColor = vec4(sum, 1.0);
}
