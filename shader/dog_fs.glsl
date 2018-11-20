//
//  dog_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform float sigmaE;
uniform float sigmaR;
uniform float tau;
uniform float phi;
uniform vec2 imgSize;
varying vec2 texCoord;

void main() {
    float twoSigmaESquared = 2.0 * sigmaE * sigmaE;
    float twoSigmaRSquared = 2.0 * sigmaR * sigmaR;

    vec2 sum = vec2(0.0);
    vec2 norm = vec2(0.0);

    for (int i = -$halfWidth$; i <= $halfWidth$; i++) {
		for (int j = -$halfWidth$; j <= $halfWidth$; j++) {
            float d = length(vec2(i,j));
            vec2 kernel = vec2( exp( -d * d / twoSigmaESquared ),
                                exp( -d * d / twoSigmaRSquared ));

            vec2 L = texture2D(img, texCoord + vec2(i,j) / imgSize).xx;
            norm += 2.0 * kernel;
            sum += kernel * L;
        }
    }
    sum /= norm;

    float H = 100.0 * (sum.x - tau * sum.y);
    float edge = ( H > 0.0 )? 1.0 : 2.0 * smoothstep(-2.0, 2.0, phi * H );
    gl_FragColor = vec4(vec3(edge), 1.0);
}
