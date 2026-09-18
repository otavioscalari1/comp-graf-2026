const canvas = document.getElementById('canvas');
const canvasCoordsText = document.getElementById('canvasCoordinates');
const webglCoordsText = document.getElementById('webglCoordinates');

// 1. Inicializa o contexto WebGL
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL não suportado no seu navegador!');
}

// 2. Códigos dos Shaders em GLSL
const vsSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = 6.0; // Tamanho do ponto inicial
    }
`;

const fsSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Cor Azul (R=0, G=0, B=1, A=1)
    }
`;

// Função auxiliar para compilar um shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

// Compila os shaders e cria o programa WebGL
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// 3. Configura os Buffers
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Define a cor de fundo (cinza escuro)
gl.clearColor(0.2, 0.2, 0.2, 1.0);

// Array para armazenar todos os vértices desenhados
let pontos = [];
let ponto1 = null;

// Função para renderizar a cena WebGL
function render() {
    // Limpa a tela com a cor de fundo
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (pontos.length > 0) {
        // Envia os dados atualizados de pontos para a GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pontos), gl.STATIC_DRAW);

        // Desenha os pares de pontos registrados como linhas (gl.LINES)
        gl.drawArrays(gl.LINES, 0, pontos.length / 2);
    }
}

// Renderiza o fundo inicialmente
render();

// 4. Manipulador de Eventos de Clique
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();

    // Coordenadas do Canvas (Pixels)
    const canvasX = Math.round(event.clientX - rect.left);
    const canvasY = Math.round(event.clientY - rect.top);

    // Coordenadas WebGL Normalizadas (-1.0 a +1.0)
    const webglX = (canvasX / canvas.width) * 2 - 1;
    const webglY = 1 - (canvasY / canvas.height) * 2;

    // Atualiza a interface
    canvasCoordsText.textContent = `Canvas: (${canvasX}, ${canvasY})`;
    webglCoordsText.textContent = `WebGL: (${webglX.toFixed(3)}, ${webglY.toFixed(3)})`;

    // Lógica dos pontos
    if (ponto1 === null) {
        ponto1 = { x: webglX, y: webglY };
    } else {
        // Adiciona as coordenadas do Ponto 1 e do Ponto 2 no array de vértices
        pontos.push(ponto1.x, ponto1.y);
        pontos.push(webglX, webglY);

        // Reseta o ponto1 para o próximo par de cliques
        ponto1 = null;

        // Redesenha a cena com a nova linha
        render();
    }
});