export const voxelObjectShaderVertex = `#version 300 es
layout(location = 0) in vec3 _position;
layout(location = 1) in vec3 _texture;
// object placement as instance attributes
layout(location = 2) in vec3 objLocation;
layout(location = 4) in float objRotation;
layout(location = 3) in vec3 objScale;

out vec3 textureCoordinates;
out vec2 shadowMapCoordinates;
out float depth;

// world slice separation
uniform float sliceSeparation;

// viewing camera parameters
uniform float heightToWidthRatio;
uniform vec3  focusPoint;
uniform float zoom;
uniform float angle;
uniform float shallowness;

// shadow camera parameters
uniform vec3 shadowFocusPoint;
uniform float shadowAngle;
uniform float shadowZoom;
uniform float shadowShallowness;

vec3 localToWorld(
  vec3 local,
  vec3 scale,
  float rotation,
  vec3 position
) {
  local *= scale;

  float cos_angle = cos(rotation);
  float sin_angle = sin(rotation);

  vec2 rot = vec2(
    local.x * cos_angle - local.y * sin_angle,
    local.y * cos_angle + local.x * sin_angle
  );

  return vec3(
    rot.x + position.x,
    rot.y + position.y,
    local.z + position.z
  );
}

vec2 worldToScreen(
  vec3 world,
  float heightToWidthRatio,
  float zoom,
  float shallowness,
  float angle,
  vec3 focusPoint
) {
  vec2 rot = world.xy - focusPoint.xy;

  float cos_angle = cos(-angle);
  float sin_angle = sin(-angle);

  vec2 centered = vec2(
    rot.x * cos_angle - rot.y * sin_angle,
    rot.y * cos_angle + rot.x * sin_angle
  );

  centered /= zoom;
  centered.y += (world.z - focusPoint.z) / (zoom * shallowness);
  centered.y /= heightToWidthRatio;
  vec2 local = centered * 2.0;
  return local;
}

void main() {

  float sliceDepth = _position.z * sliceSeparation;
  textureCoordinates = _texture;

  vec3 local = vec3(_position.xy, sliceDepth);

  vec3 world = localToWorld(
    local,
    objScale,
    objRotation,
    objLocation
  );

  vec2 screen = worldToScreen(
    world,
    heightToWidthRatio,
    zoom,
    shallowness,
    angle,
    focusPoint
  );

  shadowMapCoordinates = worldToScreen(
    world,
    1.0,
    shadowZoom,
    shadowShallowness,
    shadowAngle,
    shadowFocusPoint
  ) * 0.5 + vec2(0.5, 0.5);

  depth = world.z;
  gl_Position = vec4(screen.x, screen.y, -world.z, 1.0);
}
`

export const voxelObjectShaderFragment = `#version 300 es
precision highp float;

in vec3 textureCoordinates;
in vec2 shadowMapCoordinates;
in float depth;

uniform mediump sampler2DArray objectSlice;

layout(location = 0) out vec4 FragColor;
layout(location = 1) out vec4 ShadowParameters;

void main() {
  vec4 tex = texture(objectSlice, textureCoordinates);
  if (tex.a < 0.5)
    discard;

  FragColor = vec4(tex.rgb, 1.0);
  ShadowParameters = vec4(shadowMapCoordinates, depth, 1.0);
}
`;

export const voxelObjectShadowShaderVertex = `#version 300 es
layout(location = 0) in vec3 _position;
layout(location = 1) in vec3 _texture;
// object placement as instance attributes
layout(location = 2) in vec3 objLocation;
layout(location = 4) in float objRotation;
layout(location = 3) in vec3 objScale;

out vec3 textureCoordinates;
out float depth;

// world parameters
uniform float sliceSeparation;

// viewing camera parameters
uniform float heightToWidthRatio;
uniform vec3  focusPoint;
uniform float zoom;
uniform float angle;
uniform float shallowness;

vec3 localToWorld(
  vec3 local,
  vec3 scale,
  float rotation,
  vec3 position
) {
  local *= scale;

  float cos_angle = cos(rotation);
  float sin_angle = sin(rotation);

  vec2 rot = vec2(
    local.x * cos_angle - local.y * sin_angle,
    local.y * cos_angle + local.x * sin_angle
  );

  return vec3(
    rot.x + position.x,
    rot.y + position.y,
    local.z + position.z
  );
}

vec2 worldToScreen(
  vec3 world,
  float heightToWidthRatio,
  float zoom,
  float shallowness,
  float angle,
  vec3 focusPoint
) {
  vec2 rot = world.xy - focusPoint.xy;

  float cos_angle = cos(-angle);
  float sin_angle = sin(-angle);

  vec2 centered = vec2(
    rot.x * cos_angle - rot.y * sin_angle,
    rot.y * cos_angle + rot.x * sin_angle
  );

  centered /= zoom;
  centered.y += (world.z - focusPoint.z) / (zoom * shallowness);
  centered.y /= heightToWidthRatio;
  vec2 local = centered * 2.0;
  return local;
}

void main() {
  float sliceDepth = _position.z * sliceSeparation;
  textureCoordinates = _texture;
  vec3 local = vec3(_position.xy, sliceDepth);

  vec3 world = localToWorld(
    local,
    objScale,
    objRotation,
    objLocation
  );

  vec2 screen = worldToScreen(
    world,
    heightToWidthRatio,
    zoom,
    shallowness,
    angle,
    focusPoint
  );

  gl_Position = vec4(screen.x, screen.y, -world.z, 1.0);
  depth = world.z;
}
`

export const voxelObjectShadowShaderFragment = `#version 300 es
precision highp float;

in vec3 textureCoordinates;

in float depth;

uniform mediump sampler2DArray objectSlice;

layout(location = 0) out vec4 FragColor;

void main() {
  vec4 tex = texture(objectSlice, textureCoordinates);
  if (tex.a < 0.5)
    discard;
  FragColor = vec4(vec3(depth), 1.0);
}
`;
