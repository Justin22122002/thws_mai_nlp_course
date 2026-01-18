"use strict";

export class DeferredBuffer  {

    constructor(gl, width, height) {
	this.gl = gl;
	this.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

	// this will get unlit RGBA values
	this.colorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(
	    gl.TEXTURE_2D,
	    0,
	    gl.RGBA,
	    width,
	    height,
	    0,
	    gl.RGBA,
	    gl.UNSIGNED_BYTE,
	    null
	);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
	
	// this will get shadow map coordinates and depth values
	this.shadowParameterTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.shadowParameterTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(
	    gl.TEXTURE_2D,
	    0,
	    gl.RGBA16F,
	    width,
	    height,
	    0,
	    gl.RGBA,
	    gl.HALF_FLOAT,
	    null
	);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.shadowParameterTexture, 0);

	this.depthbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthbuffer);

	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    
    bind(){
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    }
    unbind (){
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    getAlbedoTexture() {
	return this.colorTexture;
    }
    getShadowParameterTexture() {
	return this.shadowParameterTexture;
    }
}
