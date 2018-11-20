//
//  lic_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D tfm;
uniform sampler2D img;
uniform float sigma;
uniform vec2 imgSize;

varying vec2 texCoord;

struct lic_t {
    vec2 p;
    vec2 t;
    float w;
    float dw;
};

void step(inout lic_t s) {
    vec2 t = (texture2D(tfm, s.p).xy - 0.5) * 2.0;
    if (dot(t, s.t) < 0.0) t = -t;
    s.t = t;

    s.dw = (abs(t.x) > abs(t.y))?
        abs((fract(s.p.x) - 0.5 - sign(t.x)) / t.x) :
        abs((fract(s.p.y) - 0.5 - sign(t.y)) / t.y);

    s.p += t * s.dw / imgSize;
    s.w += s.dw;
}

void main (void) {
    float twoSigma2 = 2.0 * sigma * sigma;

    vec3 c = texture2D( img, texCoord ).xyz;
    float w = 1.0;

    lic_t a, b;
    a.p = b.p = texCoord;
    a.t = (texture2D( tfm, texCoord ).xy - 0.5) * 2.0;
    a.t /= imgSize;
    b.t = -a.t;
    a.w = b.w = 0.0;

    for (int i = 0; i < $halfWidth$; ++i) {
        step(a);
        float k = a.dw * exp(-a.w * a.w / twoSigma2);
        c += k * texture2D(img, a.p).xyz;
        w += k;
    }
    for (int i = 0; i < $halfWidth$; ++i) {
        step(b);
        float k = b.dw * exp(-b.w * b.w / twoSigma2);
        c += k * texture2D(img, b.p).xyz;
        w += k;
    }
    c /= w;

    gl_FragColor = vec4(c, 1.0);
}