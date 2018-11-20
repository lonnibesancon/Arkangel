//
//  gauss1d_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

varying vec2 texCoord;

uniform sampler2D img;
uniform vec2 imgSize;
uniform float sigma;
uniform bool horizontal;

void main()
{
	float twoSigma2 = 2.0 * sigma * sigma;

	vec3 sum = vec3(0.0);
	if ($halfWidth$ > 0) {
		float norm = 0.0;

		for (int i = -$halfWidth$; i<= $halfWidth$; i++) {
			vec2 bias = horizontal ? vec2(i, 0) : vec2(0, i);
			float kernel = exp( -float(i) * float(i) / twoSigma2 );

			vec3 c = texture2D(img, texCoord + bias / imgSize).rgb;

			norm += kernel;
			sum += kernel * c;
		}
		sum /= norm;
	} else {
		sum =  texture2D(img, texCoord).rgb;
	}
	gl_FragColor = vec4(sum, 1.0);
}
