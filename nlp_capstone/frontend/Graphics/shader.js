export function loadShader(gl, vertexSource, fragmentSource) {
    const vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vertexSource);
    gl.compileShader(vshader);
    if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
	throw new Error(gl.getShaderInfoLog(vshader));
    }
    
    const fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fragmentSource);
    gl.compileShader(fshader);
    if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
	throw new Error(gl.getShaderInfoLog(fshader));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	throw new Error(gl.getProgramInfoLog(program));
    }

    const uniformLocationMap = new Map();

    const uniformLoc = (name) => {
	const result = uniformLocationMap.get(name);
	if (result) {
	    return result;
	}
	const location = gl.getUniformLocation(program, name);
	uniformLocationMap.set(name, location);
	return location;
    };
    
    return {
	use: () => gl.useProgram(program),
	attribLocation: (attribName) => gl.getAttribLocation(program, attribName),
	setSampler: (samplerName, texUnit) => gl.uniform1i(uniformLoc(samplerName), texUnit),
	setVec2: (name, v1, v2) => gl.uniform2f(uniformLoc(name), v1, v2),
	setVec3: (name, v1, v2, v3) => gl.uniform3f(uniformLoc(name), v1, v2, v3),
	setFloat: (name, v) => gl.uniform1f(uniformLoc(name), v)
    }
}
