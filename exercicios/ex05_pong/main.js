const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;
        vertices.push(0, 0); 
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();
let corBarraDireita = new Float32Array([0.0, 0.0, 1.0]); // Azul

let verticesBarraEsquerda = verticesBarra();
let corBarraEsquerda = new Float32Array([0.0, 1.0, 0.0]); // Verde

let verticesBolaCentro = verticesBola();
let corBolaCentro = new Float32Array([1.0, 0.0, 0.0]); // Vermelha

// --------------------------------------------------
// TRANSFORMAÇÕES E BUFFER
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);
let MbarraDireita = m3.translation(0.9, 0.0);
let MbolaCentro = m3.identity();

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// SHADERS (SEM ALTERAÇÕES)
// --------------------------------------------------

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform mat3 u_transform;
out vec3 vColor;
void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec3 uColor;
out vec4 outColor;
void main() {
    outColor = vec4(uColor, 1.0);
}`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");

gl.clearColor(0.1, 0.1, 0.1, 1.0);

// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBarraEsquerda, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(colorLocation, corBarraEsquerda);
    gl.uniformMatrix3fv(transformLocation, false, MbarraEsquerda);
    gl.drawArrays(gl.TRIANGLES, 0, verticesBarraEsquerda.length / numComponents);
}

function drawBarraDireita(){
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBarraDireita, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(colorLocation, corBarraDireita);
    gl.uniformMatrix3fv(transformLocation, false, MbarraDireita);
    gl.drawArrays(gl.TRIANGLES, 0, verticesBarraDireita.length / numComponents);
}

function drawBolaCentro(){
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBolaCentro, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(colorLocation, corBolaCentro);
    gl.uniformMatrix3fv(transformLocation, false, MbolaCentro);
    gl.drawArrays(gl.TRIANGLES, 0, verticesBolaCentro.length / numComponents);
}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO E CONTROLES
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.02;
let tyBola_offset = 0.02;
let speedBarra = 0.03; 

// Objeto para registrar as teclas pressionadas
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

// Evento quando a tecla é pressionada
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'ArrowUp') { keys.ArrowUp = true; e.preventDefault(); }
    if (e.key === 'ArrowDown') { keys.ArrowDown = true; e.preventDefault(); }
});

// Evento quando a tecla é solta
document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

function atualizaAnimacao(){
    
    // Movimento Barra Verde (Esquerda)
    if (keys.w && tyBE < 0.8) tyBE += speedBarra;
    if (keys.s && tyBE > -0.8) tyBE -= speedBarra;
    
    // Movimento Barra Azul (Direita)
    if (keys.ArrowUp && tyBD < 0.8) tyBD += speedBarra;
    if (keys.ArrowDown && tyBD > -0.8) tyBD -= speedBarra;

    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);

    // Movimento da bola
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // Colisão Teto e Chão (usamos Math.abs para impedir que a bola trave)
    if (tyBola > 0.95) tyBola_offset = -Math.abs(tyBola_offset);
    if (tyBola < -0.95) tyBola_offset = Math.abs(tyBola_offset);

    // Colisão com a Barra Verde (Esquerda)
    if (txBola - 0.05 < -0.85 && txBola + 0.05 > -0.95 && tyBola + 0.05 > tyBE - 0.2 && tyBola - 0.05 < tyBE + 0.2) {
        txBola_offset = Math.abs(txBola_offset); // Vai para a direita
    }

    // Colisão com a Barra Azul (Direita)
    if (txBola + 0.05 > 0.85 && txBola - 0.05 < 0.95 && tyBola + 0.05 > tyBD - 0.2 && tyBola - 0.05 < tyBD + 0.2) {
        txBola_offset = -Math.abs(txBola_offset); // Vai para a esquerda
    }

    // Passou das laterais (Reinicia o jogo no centro)
    if (txBola > 1.1 || txBola < -1.1) {
        txBola = 0.0;
        tyBola = 0.0;
        txBola_offset = -txBola_offset; // Inverte o lado de saída
    }

    MbolaCentro = m3.translation(txBola, tyBola); 
}

// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();