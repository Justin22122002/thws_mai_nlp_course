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

uniform sampler2D tex;
out vec4 FragColor;

void main() {
  FragColor = texture(tex, textureC);
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


export function makeDebugBufferShower(gl) {
    const program = loadShader(gl, texturedQuadShaderVertex, texturedQuadShaderFragment);

    program.use();
    program.setSampler('tex', 0);
    const quad = buildQuad(gl, program);

    return {
	render: (texture) => {
	    program.use()
	    gl.activeTexture(gl.TEXTURE0);
	    gl.bindTexture(gl.TEXTURE_2D, texture);

	    quad.bind();
	    gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
    };
}
