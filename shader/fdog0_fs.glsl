//
//  fdog0_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
uniform sampler2D tfm;
uniform float sigmaE;
uniform float sigmaR;
uniform float tau;
uniform vec2 imgSize;

varying vec2 texCoord;

void main() {
    float twoSigmaESquared = 2.0 * sigmaE * sigmaE;
    float twoSigmaRSquared = 2.0 * sigmaR * sigmaR;

    vec2 t = (texture2D(tfm, texCoord).xy - 0.5) * 2.0;
    vec2 n = vec2(t.y, -t.x);
    vec2 nabs = abs(n);
    float ds = 1.0 / ((nabs.x > nabs.y)? nabs.x : nabs.y);
    n /= imgSize;

    vec2 sum = texture2D( img, texCoord ).xx;
    vec2 norm = vec2(1.0, 1.0);

    for (int i = 0; i < $halfWidth$; i++) {
    	float d = float(i) * ds;
        vec2 kernel = vec2( exp( -d * d / twoSigmaESquared ),
                            exp( -d * d / twoSigmaRSquared ));
        norm += 2.0 * kernel;

        vec2 L0 = texture2D( img, texCoord - d*n ).xx;
        vec2 L1 = texture2D( img, texCoord + d*n ).xx;

        sum += kernel * ( L0 + L1 );
    }
    sum /= norm;

    float diff = 0.5 + 100.0 * (sum.x - tau * sum.y);
    gl_FragColor = vec4(vec3(diff), 1.0);
}
