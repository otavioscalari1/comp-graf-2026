const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;


// --------------------------------------------------
// 2. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}

`;


// --------------------------------------------------
// 3. COMPILAR SHADERS
// --------------------------------------------------

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// 4. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// 5. LOCAL DO ATRIBUTO
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );


// --------------------------------------------------
// 6. BUFFER
// --------------------------------------------------

const buffer = gl.createBuffer();

gl.bindBuffer(
    gl.ARRAY_BUFFER,
    buffer
);

gl.enableVertexAttribArray(
    positionLocation
);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);


// --------------------------------------------------
// 7. FUNÇÃO PARA DESENHAR
// --------------------------------------------------

function drawShape(vertices, color) {

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        buffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );

    gl.uniform4fv(
        colorLocation,
        color
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        vertices.length / 2
    );
}


// --------------------------------------------------
// 8. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(
    0.1,
    0.1,
    0.1,
    1.0
);

gl.clear(
    gl.COLOR_BUFFER_BIT
);

gl.useProgram(program);


// --------------------------------------------------
// 9. CABEÇA DO ROBÔ
// --------------------------------------------------

// Cabeça quadrada amarela
const cabeca = [

    // Triângulo 1
    -0.6, -0.5,
     0.6, -0.5,
    -0.6,  0.5,

    // Triângulo 2
    -0.6,  0.5,
     0.6, -0.5,
     0.6,  0.5

];


// --------------------------------------------------
// 10. OLHO ESQUERDO
// --------------------------------------------------

const olhoEsquerdo = [

    // Triângulo 1
    -0.4,  0.1,
    -0.1,  0.1,
    -0.4,  0.35,

    // Triângulo 2
    -0.4,  0.35,
    -0.1,  0.1,
    -0.1,  0.35

];


// --------------------------------------------------
// 11. OLHO DIREITO
// --------------------------------------------------

const olhoDireito = [

    // Triângulo 1
     0.1,  0.1,
     0.4,  0.1,
     0.1,  0.35,

    // Triângulo 2
     0.1,  0.35,
     0.4,  0.1,
     0.4,  0.35

];


// --------------------------------------------------
// 12. BOCA
// --------------------------------------------------

const boca = [

    // Triângulo 1
    -0.3, -0.3,
     0.3, -0.3,
    -0.3, -0.15,

    // Triângulo 2
    -0.3, -0.15,
     0.3, -0.3,
     0.3, -0.15

];


// --------------------------------------------------
// 13. ANTENA
// --------------------------------------------------

const antena = [

    // Triângulo 1
    -0.05, 0.5,
     0.05, 0.5,
    -0.05, 0.75,

    // Triângulo 2
    -0.05, 0.75,
     0.05, 0.5,
     0.05, 0.75

];


// --------------------------------------------------
// 14. PONTA DA ANTENA
// --------------------------------------------------

const pontaAntena = [

    // Triângulo
    -0.12, 0.75,
     0.12, 0.75,
     0.0, 0.95

];


// --------------------------------------------------
// 15. DESENHAR
// --------------------------------------------------

// Cabeça - amarelo
drawShape(
    cabeca,
    [1.0, 1.0, 0.0, 1.0]
);


// Olho esquerdo - azul
drawShape(
    olhoEsquerdo,
    [0.0, 0.0, 1.0, 1.0]
);


// Olho direito - azul
drawShape(
    olhoDireito,
    [0.0, 0.0, 1.0, 1.0]
);


// Boca - vermelho
drawShape(
    boca,
    [1.0, 0.0, 0.0, 1.0]
);


// Antena - vermelho
drawShape(
    antena,
    [1.0, 0.0, 0.0, 1.0]
);


// Ponta da antena - azul
drawShape(
    pontaAntena,
    [0.0, 0.0, 1.0, 1.0]
);