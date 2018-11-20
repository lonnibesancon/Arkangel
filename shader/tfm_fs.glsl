//
//  tfm_fs.glsl
//  Arkangel
//
//  Contributors: Heiko Thiel, Amir Semmo
//  Copyright (c) 2018 Hasso Plattner Institute and Digital Masterpieces GmbH.
//  All rights reserved.
//

precision highp float;

uniform sampler2D img;
varying vec2 texCoord;

void main (void) {
    vec3 st = texture2D(img, texCoord).xyz;
    st = (st - 0.5) * 2.0;
    st = sign(st)*st*st;

    float lambda1 = 0.5 * (st.y + st.x +
              sqrt(st.y*st.y - 2.0*st.x*st.y + st.x*st.x + 4.0*st.z*st.z));
    vec2 v = vec2(st.x - lambda1, st.z);

    gl_FragColor = (length(v) > 0.0)?
        vec4(normalize(v)*0.5+0.5, 0.0, 1.0) :
        vec4(0.0, 1.0, 0.0, 1.0);
}

