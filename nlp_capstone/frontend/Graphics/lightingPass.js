import { loadShader } from "./shader.js";

const texturedQuadShaderVertex = `#version 300 es
in vec2 _position;
in vec2 _texture;

out vec2 textureC;

void main() {
  gl_Position = vec4(_position, 1.0, 1.0);
  textureC = _texture;
}
`;

const texturedQuadShaderFragment = `#version 300 es
precision highp float;
in vec2 textureC;

uniform sampler2D albedoTexture;
uniform sampler2D shadowParameterTexture;
uniform sampler2D shadowTexture;

layout(location = 0) out vec4 FragColor;

void main() {
  vec4 albedo = texture(albedoTexture, textureC);
  vec4 shadowParameters = texture(shadowParameterTexture, textureC);

  vec2 shadowMapCoordinates = shadowParameters.xy;
  float depth = shadowParameters.z;

  float shadow = 0.0;
  ivec2 itexelSize = textureSize(shadowTexture, 0);
  vec2 texelSize = vec2(1.0 / float(itexelSize.x), 1.0 / float(itexelSize.y));
  for(int x = -3; x <= 3; ++x)
  {
     for(int y = -3; y <= 3; ++y)
     {
         float pcfDepth = texture(shadowTexture, shadowMapCoordinates.xy + vec2(x, y) * texelSize).r; 
         shadow += (depth + 0.001) > pcfDepth ? 1.0 : 0.5;        
     }    
  }
  shadow /= 49.0;


  FragColor = vec4(albedo.rgb * shadow, 1.0);
}
`;

export function buildQuad (gl, program) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const vertices = [	// position, texcoords
	-1.0, -1.0, 0.0, 0.0,
	-1.0, 1.0, 0.0, 1.0,
	1.0, -1.0, 1.0, 0.0,
	1.0, -1.0, 1.0, 0.0,
	-1.0, 1.0, 0.0, 1.0,
	1.0, 1.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const position = program.attribLocation('_position');
    const texture = program.attribLocation('_texture');

    gl.vertexAttribPointer(position, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(texture, 2, gl.FLOAT, gl.FALSE, 16, 8);
    gl.enableVertexAttribArray(texture);
    return {
	bind: () => gl.bindVertexArray(vao)
    };
}


export function lightingPass(gl) {
    const program = loadShader(gl, texturedQuadShaderVertex, texturedQuadShaderFragment);

    program.use();
    program.setSampler('albedoTexture', 0);
    program.setSampler('shadowTexture', 8);
    program.setSampler('shadowParameterTexture', 9);
    const quad = buildQuad(gl, program);

    return {
	render: (albedoTexture, shadowTexture, shadowParameterTexture) => {
	    program.use()
	    gl.activeTexture(gl.TEXTURE0);
	    gl.bindTexture(gl.TEXTURE_2D, albedoTexture);

	    gl.activeTexture(gl.TEXTURE8);
	    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
	    
	    gl.activeTexture(gl.TEXTURE9);
	    gl.bindTexture(gl.TEXTURE_2D, shadowParameterTexture);

	    quad.bind();
	    gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
    };
}
