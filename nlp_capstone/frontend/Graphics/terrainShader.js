export const terrainShaderVertex = `#version 300 es
layout(location = 0) in vec3 _position;
layout(location = 1) in vec3 _texture;

out vec3 textureWorldCoordinates;
out vec2 shadowMapCoordinates;
out float depth;

uniform float sliceSeparation;

uniform float heightToWidthRatio;
uniform vec3  focusPoint;
uniform float zoom;
uniform float heightScale;
uniform float angle;
uniform float shallowness;

uniform vec3  shadowFocusPoint;
uniform float shadowZoom;
uniform float shadowAngle;
uniform float shadowShallowness;

vec2 localToWorldTexture(
  vec2 local,
  float heightToWidthRatio,
  float sliceDepth,
  float zoom,
  float shallowness,
  float angle,
  vec3 focusPoint
) {
  vec2 centered = local - vec2(0.5, 0.5);
  centered.y *= heightToWidthRatio;
  centered.y -= (sliceDepth - focusPoint.z) / (zoom * shallowness);
  centered *= zoom;

  float cos_angle = cos(angle);
  float sin_angle = sin(angle);

  vec2 rot = vec2(
    centered.x * cos_angle - centered.y * sin_angle,
    centered.y * cos_angle + centered.x * sin_angle
  );

  return rot + focusPoint.xy;
}

vec2 worldToLocalTexture(
  vec2 world,
  float heightToWidthRatio,
  float sliceDepth,
  float zoom,
  float shallowness,
  float angle,
  vec3 focusPoint
) {
  vec2 rot = world - focusPoint.xy;

  float cos_angle = cos(-angle);
  float sin_angle = sin(-angle);

  vec2 centered = vec2(
    rot.x * cos_angle - rot.y * sin_angle,
    rot.y * cos_angle + rot.x * sin_angle
  );

  centered /= zoom;
  centered.y += (sliceDepth - focusPoint.z) / (zoom * shallowness);
  centered.y /= heightToWidthRatio;
  vec2 local = centered + vec2(0.5, 0.5);

  return local;
}

void main() {
  float sliceDepth = _position.z * sliceSeparation * heightScale;
  gl_Position = vec4(_position.x, _position.y, -sliceDepth, 1.0);

  textureWorldCoordinates = vec3(localToWorldTexture(
    _texture.xy,
    heightToWidthRatio,
    sliceDepth,
    zoom,
    shallowness,
    angle,
    focusPoint
  ), _texture.z);

  shadowMapCoordinates = worldToLocalTexture(
    textureWorldCoordinates.xy,
    1.0,
    sliceDepth,
    shadowZoom,
    shadowShallowness,
    shadowAngle,
    shadowFocusPoint
  );

  depth = sliceDepth;
}
`

export const terrainShaderFragment = `#version 300 es
precision mediump float;

in vec3 textureWorldCoordinates;
in vec2 shadowMapCoordinates;
in float depth;

uniform mediump sampler2DArray terrainSlice;

layout(location = 0) out vec4 FragColor;
layout(location = 1) out vec4 ShadowParameters;

void main() {
  vec4 tex = texture(terrainSlice, textureWorldCoordinates);
  if (!(tex.a >= 0.5))
    discard;

  FragColor = vec4(tex.rgb, 1.0);
  ShadowParameters = vec4(shadowMapCoordinates, depth, 1.0);
}
`;

export const terrainWaterShaderFragment = `#version 300 es
precision mediump float;

in vec3 textureWorldCoordinates;
in vec2 shadowMapCoordinates;
in float depth;

uniform mediump sampler2DArray waterDepthMap;
uniform vec3 color;
uniform float time;

layout(location = 0) out vec4 FragColor;
layout(location = 1) out vec4 ShadowParameters;

void main() {
  float waterDepth = (0.5 - texture(waterDepthMap, textureWorldCoordinates).a) / 0.5;
  waterDepth = (waterDepth < 0.0) ? 0.0 : waterDepth;
  float waveCoeff = sin(waterDepth * 30.0 - time) + 1.0;
  waveCoeff *= 0.5;
  waveCoeff = mix(waveCoeff, 0.0, waterDepth);
  float shore = pow(1.0 - waterDepth, 16.0);
  float wave = mix(waveCoeff, 1.0, shore);
  wave = (wave > 0.6) ? wave*2.0 : 0.0;

  FragColor = vec4(mix(color, vec3(1.0), wave), 1.0);
  ShadowParameters = vec4(shadowMapCoordinates, depth, 1.0);
}
`;


export const terrainShadowShaderVertex = `#version 300 es
precision mediump float;

layout(location = 0) in vec3 _position;
layout(location = 1) in vec3 _texture;

out vec3 textureWorldCoordinates;
out float depth;

uniform float sliceSeparation;
uniform float heightToWidthRatio;
uniform vec3 focusPoint;
uniform float zoom;
uniform float angle;
uniform float shallowness;
uniform float heightScale;

vec2 localToWorldTexture(
  vec2 local,
  float heightToWidthRatio,
  float sliceDepth,
  float zoom,
  float shallowness,
  float angle,
  vec3 focusPoint
) {
  vec2 centered = local - vec2(0.5, 0.5);
  centered.y *= heightToWidthRatio;
  centered.y -= (sliceDepth - focusPoint.z) / (zoom * shallowness);
  centered *= zoom;

  float cos_angle = cos(angle);
  float sin_angle = sin(angle);

  vec2 rot = vec2(
    centered.x * cos_angle - centered.y * sin_angle,
    centered.y * cos_angle + centered.x * sin_angle
  );

  return rot + focusPoint.xy;
}

void main() {
  float sliceDepth = _position.z * sliceSeparation * heightScale;
  gl_Position = vec4(_position.x, _position.y, -sliceDepth, 1.0);

  textureWorldCoordinates = vec3(localToWorldTexture(
    _texture.xy,
    heightToWidthRatio,
    sliceDepth,
    zoom,
    shallowness,
    angle,
    focusPoint
  ), _texture.z);

  depth = sliceDepth;
}
`

export const terrainShadowShaderFragment = `#version 300 es
precision highp float;

in vec3 textureWorldCoordinates;
in float depth;

uniform mediump sampler2DArray terrainSlice;
uniform float sliceDepth;

layout(location = 0) out vec4 FragColor;

void main() {
  bool tex = texture(terrainSlice, textureWorldCoordinates).a >= 0.5;
  if (!tex)
    discard;
  FragColor = vec4(vec3(depth), 1.0);
}
`;
