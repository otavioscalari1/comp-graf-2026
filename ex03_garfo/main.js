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

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
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
// 7. FUNÇÃO PARA DESENHAR RETÂNGULO
// --------------------------------------------------

function drawRectangle(x1, y1, x2, y2) {

    const vertices = [

        // Triângulo 1
        x1, y1,
        x2, y1,
        x1, y2,

        // Triângulo 2
        x1, y2,
        x2, y1,
        x2, y2

    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
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
// 9. DESENHAR GARFO
// --------------------------------------------------

// Ponta esquerda
drawRectangle(
    -0.55, 0.2,
    -0.40, 0.8
);


// Ponta central
drawRectangle(
    -0.075, 0.2,
     0.075, 0.8
);


// Ponta direita
drawRectangle(
     0.40, 0.2,
     0.55, 0.8
);


// Barra horizontal
drawRectangle(
    -0.55, 0.05,
     0.55, 0.2
);


// Cabo
drawRectangle(
    -0.075, -0.8,
     0.075, 0.05
);