// --- CONSTANTES E CONFIGURAÇÕES DAS SKINS ---
const SKINS = {
    classic: {
        lightPiece: { color: 0xF5E6CA, roughness: 0.3, metalness: 0.1, transmission: 0, opacity: 1 },
        darkPiece:  { color: 0x2A1810, roughness: 0.4, metalness: 0.1, transmission: 0, opacity: 1 },
        boardLight: 0xE8D3A7,
        boardDark:  0x784421,
        boardBorder: 0x3D2314,
        bg: 0x0a0c10
    },
    cyberpunk: {
        lightPiece: { color: 0x00F0FF, roughness: 0.2, metalness: 0.8, emissive: 0x005577, emissiveIntensity: 0.6, transmission: 0, opacity: 1 },
        darkPiece:  { color: 0xFF0055, roughness: 0.2, metalness: 0.8, emissive: 0x660022, emissiveIntensity: 0.6, transmission: 0, opacity: 1 },
        boardLight: 0x1a1a2e,
        boardDark:  0x0f3460,
        boardBorder: 0x16213e,
        bg: 0x05050d
    },
    glass: {
        lightPiece: { color: 0xffffff, roughness: 0.1, metalness: 0.1, transmission: 0.9, opacity: 1, transparent: true, ior: 1.5 },
        darkPiece:  { color: 0x334155, roughness: 0.1, metalness: 0.1, transmission: 0.85, opacity: 1, transparent: true, ior: 1.5 },
        boardLight: 0xcbd5e1,
        boardDark:  0x475569,
        boardBorder: 0x1e293b,
        bg: 0x0f172a
    },
    metallic: {
        lightPiece: { color: 0xFFD700, roughness: 0.2, metalness: 0.95, transmission: 0, opacity: 1 },
        darkPiece:  { color: 0xE0E0E0, roughness: 0.25, metalness: 0.9, transmission: 0, opacity: 1 },
        boardLight: 0x333333,
        boardDark:  0x111111,
        boardBorder: 0x050505,
        bg: 0x080808
    }
};

let currentSkinKey = 'classic';

// --- VARIÁVEIS DO JOGO E CENA ---
let scene, camera, renderer, controls;
let boardGroup, piecesGroup, squaresArray = [];
let boardState = Array(8).fill(null).map(() => Array(8).fill(null));

let selectedSquare = null;
let validMoves = [];
let currentTurn = 'w'; // 'w' ou 'b'
let moveHistory = [];
let isGameOver = false;
let isCheck = false;

// Regras e Animações
let enPassantTarget = null;
let pendingPromotion = null;
let activeAnimations = [];
let particles = [];
let confettiParticles = [];

// Variáveis para diferenciar clique de arrasto
let pointerDownPos = { x: 0, y: 0 };

// Elementos HTML
const container = document.getElementById('canvas-container');
const turnBadge = document.getElementById('turnBadge');
const turnText = document.getElementById('turnText');
const turnDot = document.getElementById('turnDot');
const moveLog = document.getElementById('moveLog');
const moveCount = document.getElementById('moveCount');
const bannerAlert = document.getElementById('bannerAlert');
const bannerText = document.getElementById('bannerText');
const skinSelector = document.getElementById('skinSelector');
const promotionModal = document.getElementById('promotionModal');

// --- SETUP INICIAL 3D ---
function init3D() {
    const width = container.clientWidth || (window.innerWidth - 288);
    const height = container.clientHeight || (window.innerHeight - 60);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SKINS[currentSkinKey].bg);
    scene.fog = new THREE.FogExp2(SKINS[currentSkinKey].bg, 0.012);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.target.set(0, 0, 0);

    setupLights();

    boardGroup = new THREE.Group();
    piecesGroup = new THREE.Group();
    scene.add(boardGroup);
    scene.add(piecesGroup);

    buildBoard();
    setupInitialPieces();

    window.addEventListener('resize', onWindowResize);
    
    // Registrar pointerdown e pointerup para evitar clicar enquanto arrasta a câmera
    renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    document.getElementById('btnFlip').addEventListener('click', flipCamera);
    document.getElementById('btnReset').addEventListener('click', resetGame);
    skinSelector.addEventListener('change', (e) => updateSkin(e.target.value));

    document.querySelectorAll('.promo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            executePromotion(btn.dataset.piece);
        });
    });

    onWindowResize();
    animate();
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 15, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 8;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x90e0ef, 0.3);
    fillLight.position.set(-8, 10, -8);
    scene.add(fillLight);
}

// --- CONSTRUÇÃO DO TABULEIRO ---
function buildBoard() {
    while(boardGroup.children.length > 0) boardGroup.remove(boardGroup.children[0]);
    squaresArray = [];

    const skin = SKINS[currentSkinKey];
    const squareGeo = new THREE.BoxGeometry(1, 0.3, 1);

    for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 8; z++) {
            const isLight = (x + z) % 2 === 0;
            const mat = new THREE.MeshStandardMaterial({ 
                color: isLight ? skin.boardLight : skin.boardDark, 
                roughness: 0.4 
            });
            const mesh = new THREE.Mesh(squareGeo, mat);
            mesh.position.set(x - 3.5, -0.15, z - 3.5);
            mesh.receiveShadow = true;
            mesh.userData = { type: 'square', x, z };
            
            boardGroup.add(mesh);
            squaresArray.push(mesh);
        }
    }

    const borderGeo = new THREE.BoxGeometry(9, 0.4, 9);
    const borderMat = new THREE.MeshStandardMaterial({ color: skin.boardBorder, roughness: 0.5 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.set(0, -0.21, 0);
    borderMesh.receiveShadow = true;
    boardGroup.add(borderMesh);
}

// GEOMETRIA DAS PEÇAS
function createPieceGeometry(type) {
    let points = [];
    switch (type) {
        case 'P':
            points = [
                new THREE.Vector2(0, 0), new THREE.Vector2(0.35, 0),
                new THREE.Vector2(0.35, 0.08), new THREE.Vector2(0.25, 0.12),
                new THREE.Vector2(0.18, 0.3), new THREE.Vector2(0.12, 0.55),
                new THREE.Vector2(0.2, 0.62), new THREE.Vector2(0.2, 0.68),
                new THREE.Vector2(0.22, 0.72), new THREE.Vector2(0, 0.88)
            ];
            return new THREE.LatheGeometry(points, 24);

        case 'R':
            points = [
                new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0),
                new THREE.Vector2(0.4, 0.12), new THREE.Vector2(0.28, 0.2),
                new THREE.Vector2(0.22, 0.7), new THREE.Vector2(0.32, 0.78),
                new THREE.Vector2(0.32, 1.0), new THREE.Vector2(0, 1.0)
            ];
            return new THREE.LatheGeometry(points, 24);

        case 'B':
            points = [
                new THREE.Vector2(0, 0), new THREE.Vector2(0.38, 0),
                new THREE.Vector2(0.38, 0.1), new THREE.Vector2(0.25, 0.2),
                new THREE.Vector2(0.16, 0.75), new THREE.Vector2(0.25, 0.88),
                new THREE.Vector2(0.12, 1.15), new THREE.Vector2(0.05, 1.22),
                new THREE.Vector2(0, 1.25)
            ];
            return new THREE.LatheGeometry(points, 24);

        case 'Q':
            points = [
                new THREE.Vector2(0, 0), new THREE.Vector2(0.42, 0),
                new THREE.Vector2(0.42, 0.12), new THREE.Vector2(0.3, 0.22),
                new THREE.Vector2(0.18, 0.85), new THREE.Vector2(0.32, 1.05),
                new THREE.Vector2(0.35, 1.25), new THREE.Vector2(0.12, 1.35),
                new THREE.Vector2(0, 1.4)
            ];
            return new THREE.LatheGeometry(points, 28);

        case 'K':
            points = [
                new THREE.Vector2(0, 0), new THREE.Vector2(0.44, 0),
                new THREE.Vector2(0.44, 0.14), new THREE.Vector2(0.32, 0.25),
                new THREE.Vector2(0.2, 0.9), new THREE.Vector2(0.35, 1.15),
                new THREE.Vector2(0.25, 1.35), new THREE.Vector2(0.1, 1.45),
                new THREE.Vector2(0, 1.5)
            ];
            return new THREE.LatheGeometry(points, 28);

        case 'N':
            const group = new THREE.Group();
            const baseGeo = new THREE.LatheGeometry([
                new THREE.Vector2(0, 0), new THREE.Vector2(0.38, 0),
                new THREE.Vector2(0.38, 0.1), new THREE.Vector2(0.25, 0.25),
                new THREE.Vector2(0.2, 0.4)
            ], 20);
            group.add(new THREE.Mesh(baseGeo));

            const headShape = new THREE.BoxGeometry(0.3, 0.55, 0.45);
            headShape.translate(0, 0.65, 0.08);
            const headMesh = new THREE.Mesh(headShape);
            headMesh.rotation.x = 0.25;
            group.add(headMesh);
            return group;
    }
}

function getPieceMaterial(color) {
    const skin = SKINS[currentSkinKey];
    const props = color === 'w' ? skin.lightPiece : skin.darkPiece;
    return new THREE.MeshPhysicalMaterial({ ...props });
}

function createPieceMesh(type, color) {
    const geoOrGroup = createPieceGeometry(type);
    const mat = getPieceMaterial(color);

    let mesh;
    if (geoOrGroup instanceof THREE.Group) {
        mesh = geoOrGroup;
        mesh.traverse(child => {
            if(child.isMesh) {
                child.material = mat;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    } else {
        mesh = new THREE.Mesh(geoOrGroup, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    if (color === 'b') mesh.rotation.y = Math.PI;
    return mesh;
}

function setupInitialPieces() {
    while(piecesGroup.children.length > 0) piecesGroup.remove(piecesGroup.children[0]);
    boardState = Array(8).fill(null).map(() => Array(8).fill(null));

    const layout = [
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        null, null, null, null,
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    for (let z = 0; z < 8; z++) {
        if (!layout[z]) continue;
        const color = z < 2 ? 'b' : 'w';
        for (let x = 0; x < 8; x++) {
            spawnPiece(layout[z][x], color, x, z);
        }
    }
}

function spawnPiece(type, color, x, z) {
    const mesh = createPieceMesh(type, color);
    mesh.position.set(x - 3.5, 0, z - 3.5);
    piecesGroup.add(mesh);

    const pieceData = { type, color, mesh, x, z, hasMoved: false };
    boardState[z][x] = pieceData;
    mesh.userData = pieceData;
}

function updateSkin(newSkinKey) {
    if (!SKINS[newSkinKey]) return;
    currentSkinKey = newSkinKey;

    scene.background = new THREE.Color(SKINS[currentSkinKey].bg);
    scene.fog.color = new THREE.Color(SKINS[currentSkinKey].bg);

    buildBoard();

    for (let z = 0; z < 8; z++) {
        for (let x = 0; x < 8; x++) {
            const piece = boardState[z][x];
            if (piece) {
                const mat = getPieceMaterial(piece.color);
                piece.mesh.traverse(child => {
                    if (child.isMesh) child.material = mat;
                });
            }
        }
    }
    highlightSquares();
}

// --- INTERAÇÃO E CLIQUE DE JOGO (RAYCASTING CORRIGIDO) ---
function onPointerUp(event) {
    if (isGameOver || pendingPromotion) return;
    if (event.button !== 0) return; // Apenas botão esquerdo

    // Se o usuário moveu o mouse mais de 5px, considera arrasto de câmera, NÃO clique
    const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
    if (dist > 5) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Testar colisão com as peças e as casas do tabuleiro
    const candidates = [...squaresArray];
    piecesGroup.traverse(child => {
        if (child.isMesh) candidates.push(child);
    });

    const intersects = raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
        let hitMesh = intersects[0].object;

        // Subir na hierarquia se for um filho (ex: cabeça do cavalo)
        let rootObj = hitMesh;
        while (rootObj.parent && rootObj.parent !== piecesGroup && rootObj.parent !== boardGroup) {
            rootObj = rootObj.parent;
        }

        // Se clicou em uma peça de xadrez
        if (rootObj.userData && rootObj.userData.color) {
            const { x, z } = rootObj.userData;
            handleSquareClick(x, z);
        } 
        // Se clicou em uma casa do tabuleiro
        else if (rootObj.userData && rootObj.userData.type === 'square') {
            const { x, z } = rootObj.userData;
            handleSquareClick(x, z);
        }
    }
}

function handleSquareClick(x, z) {
    const clickedPiece = boardState[z][x];

    if (selectedSquare) {
        // Se a casa clicada é uma jogada válida -> Executa
        const isMoveValid = validMoves.some(m => m.x === x && m.z === z);
        if (isMoveValid) {
            makeMove(selectedSquare.x, selectedSquare.z, x, z);
            clearSelection();
            return;
        }
    }

    // Selecionar peça do turno atual
    if (clickedPiece && clickedPiece.color === currentTurn) {
        selectedSquare = { x, z };
        validMoves = getLegalMovesForPiece(x, z);
        highlightSquares();
    } else {
        clearSelection();
    }
}

function clearSelection() {
    selectedSquare = null;
    validMoves = [];
    highlightSquares();
}

function highlightSquares() {
    squaresArray.forEach(child => {
        const { x, z } = child.userData;
        const isSelected = selectedSquare && selectedSquare.x === x && selectedSquare.z === z;
        const isValidMove = validMoves.some(m => m.x === x && m.z === z);
        const isKingInCheckSquare = isCheck && boardState[z][x]?.type === 'K' && boardState[z][x]?.color === currentTurn;

        if (isSelected) {
            child.material.color.setHex(0x00d2ff); // Azul Ciano (Selecionada)
        } else if (isValidMove) {
            const targetPiece = boardState[z][x];
            const isEnPassant = enPassantTarget && enPassantTarget.x === x && enPassantTarget.z === z && boardState[selectedSquare.z][selectedSquare.x]?.type === 'P';
            
            if (targetPiece || isEnPassant) {
                child.material.color.setHex(0xff3366); // Vermelho (Captura)
            } else {
                child.material.color.setHex(0x20bf6b); // Verde (Movimento Válido)
            }
        } else if (isKingInCheckSquare) {
            child.material.color.setHex(0xff0000); // Vermelho Alerta Xeque
        } else {
            const isLight = (x + z) % 2 === 0;
            child.material.color.setHex(isLight ? SKINS[currentSkinKey].boardLight : SKINS[currentSkinKey].boardDark);
        }
    });
}

// --- REGRAS DO XADREZ ---
function getPseudoMoves(x, z, state = boardState) {
    const piece = state[z][x];
    if (!piece) return [];
    
    const moves = [];
    const color = piece.color;
    const enemyColor = color === 'w' ? 'b' : 'w';
    const dir = color === 'w' ? -1 : 1;

    const isInside = (cx, cz) => cx >= 0 && cx < 8 && cz >= 0 && cz < 8;

    switch (piece.type) {
        case 'P':
            if (isInside(x, z + dir) && !state[z + dir][x]) {
                moves.push({ x, z: z + dir });
                const startRow = color === 'w' ? 6 : 1;
                if (z === startRow && !state[z + 2 * dir][x]) {
                    moves.push({ x, z: z + 2 * dir });
                }
            }
            [-1, 1].forEach(dx => {
                const nx = x + dx, nz = z + dir;
                if (isInside(nx, nz)) {
                    if (state[nz][nx] && state[nz][nx].color === enemyColor) {
                        moves.push({ x: nx, z: nz });
                    }
                    if (enPassantTarget && enPassantTarget.x === nx && enPassantTarget.z === nz) {
                        moves.push({ x: nx, z: nz, isEnPassant: true });
                    }
                }
            });
            break;

        case 'N':
            const nOffsets = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
            nOffsets.forEach(([dx, dz]) => {
                const nx = x + dx, nz = z + dz;
                if (isInside(nx, nz) && (!state[nz][nx] || state[nz][nx].color === enemyColor)) {
                    moves.push({ x: nx, z: nz });
                }
            });
            break;

        case 'B':
            [[-1,-1], [-1,1], [1,-1], [1,1]].forEach(([dx, dz]) => {
                let step = 1;
                while (true) {
                    const nx = x + dx * step, nz = z + dz * step;
                    if (!isInside(nx, nz)) break;
                    if (!state[nz][nx]) {
                        moves.push({ x: nx, z: nz });
                    } else {
                        if (state[nz][nx].color === enemyColor) moves.push({ x: nx, z: nz });
                        break;
                    }
                    step++;
                }
            });
            break;

        case 'R':
            [[-1,0], [1,0], [0,-1], [0,1]].forEach(([dx, dz]) => {
                let step = 1;
                while (true) {
                    const nx = x + dx * step, nz = z + dz * step;
                    if (!isInside(nx, nz)) break;
                    if (!state[nz][nx]) {
                        moves.push({ x: nx, z: nz });
                    } else {
                        if (state[nz][nx].color === enemyColor) moves.push({ x: nx, z: nz });
                        break;
                    }
                    step++;
                }
            });
            break;

        case 'Q':
            [[-1,-1], [-1,1], [1,-1], [1,1], [-1,0], [1,0], [0,-1], [0,1]].forEach(([dx, dz]) => {
                let step = 1;
                while (true) {
                    const nx = x + dx * step, nz = z + dz * step;
                    if (!isInside(nx, nz)) break;
                    if (!state[nz][nx]) {
                        moves.push({ x: nx, z: nz });
                    } else {
                        if (state[nz][nx].color === enemyColor) moves.push({ x: nx, z: nz });
                        break;
                    }
                    step++;
                }
            });
            break;

        case 'K':
            [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]].forEach(([dx, dz]) => {
                const nx = x + dx, nz = z + dz;
                if (isInside(nx, nz) && (!state[nz][nx] || state[nz][nx].color === enemyColor)) {
                    moves.push({ x: nx, z: nz });
                }
            });
            break;
    }
    return moves;
}

function isKingInCheck(color, state = boardState) {
    let kingPos = null;
    for (let z = 0; z < 8; z++) {
        for (let x = 0; x < 8; x++) {
            if (state[z][x] && state[z][x].type === 'K' && state[z][x].color === color) {
                kingPos = { x, z };
                break;
            }
        }
    }
    if (!kingPos) return false;

    const enemyColor = color === 'w' ? 'b' : 'w';
    for (let z = 0; z < 8; z++) {
        for (let x = 0; x < 8; x++) {
            if (state[z][x] && state[z][x].color === enemyColor) {
                const enemyMoves = getPseudoMoves(x, z, state);
                if (enemyMoves.some(m => m.x === kingPos.x && m.z === kingPos.z)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getLegalMovesForPiece(x, z) {
    const pseudoMoves = getPseudoMoves(x, z);
    const piece = boardState[z][x];
    const legalMoves = [];

    pseudoMoves.forEach(move => {
        const tempState = boardState.map(row => [...row]);
        tempState[move.z][move.x] = tempState[z][x];
        tempState[z][x] = null;

        if (piece.type === 'P' && enPassantTarget && move.x === enPassantTarget.x && move.z === enPassantTarget.z) {
            const capturedPawnZ = piece.color === 'w' ? move.z + 1 : move.z - 1;
            tempState[capturedPawnZ][move.x] = null;
        }

        if (!isKingInCheck(piece.color, tempState)) {
            legalMoves.push(move);
        }
    });

    return legalMoves;
}

function getAllLegalMoves(color) {
    let allMoves = [];
    for (let z = 0; z < 8; z++) {
        for (let x = 0; x < 8; x++) {
            if (boardState[z][x] && boardState[z][x].color === color) {
                const moves = getLegalMovesForPiece(x, z);
                if (moves.length > 0) allMoves.push({ from: { x, z }, moves });
            }
        }
    }
    return allMoves;
}

// EXECUÇÃO DO MOVIMENTO
function makeMove(fromX, fromZ, toX, toZ) {
    const piece = boardState[fromZ][fromX];
    let capturedPiece = boardState[toZ][toX];

    if (piece.type === 'P' && enPassantTarget && toX === enPassantTarget.x && toZ === enPassantTarget.z) {
        const capturedPawnZ = piece.color === 'w' ? toZ + 1 : toZ - 1;
        capturedPiece = boardState[capturedPawnZ][toX];
        boardState[capturedPawnZ][toX] = null;
    }

    if (piece.type === 'P' && Math.abs(toZ - fromZ) === 2) {
        enPassantTarget = { x: fromX, z: (fromZ + toZ) / 2 };
    } else {
        enPassantTarget = null;
    }

    boardState[toZ][toX] = piece;
    boardState[fromZ][fromX] = null;
    piece.x = toX;
    piece.z = toZ;
    piece.hasMoved = true;

    if (capturedPiece) {
        createShatterParticleEffect(capturedPiece.mesh.position.clone());
        piecesGroup.remove(capturedPiece.mesh);
    }

    const targetPos = new THREE.Vector3(toX - 3.5, 0, toZ - 3.5);
    animatePieceMove(piece.mesh, targetPos);

    recordMove(piece, fromX, fromZ, toX, toZ, capturedPiece !== null);

    const promotionRow = piece.color === 'w' ? 0 : 7;
    if (piece.type === 'P' && toZ === promotionRow) {
        pendingPromotion = { piece, toX, toZ };
        openPromotionModal();
        return;
    }

    finishTurn();
}

function finishTurn() {
    currentTurn = currentTurn === 'w' ? 'b' : 'w';
    updateTurnUI();

    isCheck = isKingInCheck(currentTurn);
    const legalMoves = getAllLegalMoves(currentTurn);

    if (legalMoves.length === 0) {
        isGameOver = true;
        if (isCheck) {
            const winner = currentTurn === 'w' ? 'PRETAS' : 'BRANCAS';
            showBanner(`XEQUE-MATE! VITÓRIA DAS ${winner}`, 'bg-emerald-600/90', true);
            triggerConfetti();
        } else {
            showBanner(`EMPATE POR AFOGAMENTO!`, 'bg-amber-600/90', true);
        }
    } else if (isCheck) {
        showBanner(`XEQUE! O REI ESTÁ AMEAÇADO!`, 'bg-red-600/90', false);
    } else {
        hideBanner();
    }

    highlightSquares();
}

// PROMOÇÃO
function openPromotionModal() {
    promotionModal.classList.remove('hidden');
    setTimeout(() => promotionModal.classList.remove('opacity-0'), 10);
}

function executePromotion(chosenType) {
    if (!pendingPromotion) return;

    const { piece, toX, toZ } = pendingPromotion;
    piecesGroup.remove(piece.mesh);

    const newPieceMesh = createPieceMesh(chosenType, piece.color);
    newPieceMesh.position.set(toX - 3.5, 0, toZ - 3.5);
    piecesGroup.add(newPieceMesh);

    const updatedPiece = {
        type: chosenType,
        color: piece.color,
        mesh: newPieceMesh,
        x: toX,
        z: toZ,
        hasMoved: true
    };

    boardState[toZ][toX] = updatedPiece;
    newPieceMesh.userData = updatedPiece;

    createShatterParticleEffect(newPieceMesh.position.clone(), 0x00F0FF);
    pendingPromotion = null;

    promotionModal.classList.add('opacity-0');
    setTimeout(() => {
        promotionModal.classList.add('hidden');
        finishTurn();
    }, 300);
}

// ANIMAÇÕES
function animatePieceMove(mesh, targetPos) {
    const startPos = mesh.position.clone();
    const duration = 350;
    const startTime = performance.now();

    activeAnimations.push({
        update: (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

            mesh.position.lerpVectors(startPos, targetPos, ease);
            mesh.position.y = Math.sin(progress * Math.PI) * 0.8;

            return progress < 1;
        }
    });
}

function createShatterParticleEffect(pos, overrideColor = null) {
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    for (let i = 0; i < 25; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: overrideColor || (Math.random() > 0.5 ? 0xff0055 : 0xffcc00) });
        const p = new THREE.Mesh(geom, mat);
        p.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 6
        );

        scene.add(p);
        particles.push({ mesh: p, velocity, life: 1.0 });
    }
}

function triggerConfetti() {
    const colors = [0xff0055, 0x00f0ff, 0xffd700, 0x00ff66, 0x9d4edd];
    for (let i = 0; i < 150; i++) {
        const geo = new THREE.PlaneGeometry(0.15, 0.15);
        const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set((Math.random() - 0.5) * 10, Math.random() * 8 + 6, (Math.random() - 0.5) * 10);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        scene.add(mesh);
        confettiParticles.push({
            mesh,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, -Math.random() * 2 - 1, (Math.random() - 0.5) * 1.5),
            rotSpeed: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5)
        });
    }
}

// UI
function updateTurnUI() {
    if (currentTurn === 'w') {
        turnBadge.className = 'flex items-center gap-2 font-bold text-sm text-slate-900 bg-amber-100 px-3 py-0.5 rounded-full shadow-sm';
        turnDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 inline-block';
        turnText.textContent = 'BRANCAS';
    } else {
        turnBadge.className = 'flex items-center gap-2 font-bold text-sm text-slate-100 bg-slate-800 border border-slate-700 px-3 py-0.5 rounded-full shadow-sm';
        turnDot.className = 'w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block';
        turnText.textContent = 'PRETAS';
    }
}

function showBanner(text, bgColorClass, persistent = false) {
    bannerText.textContent = text;
    bannerAlert.firstElementChild.className = `${bgColorClass} text-white font-extrabold text-base px-8 py-2.5 rounded-full shadow-2xl backdrop-blur-md tracking-wider flex items-center gap-3 border border-white/20`;
    bannerAlert.classList.remove('-translate-y-12', 'opacity-0');

    if (!persistent) setTimeout(() => hideBanner(), 3500);
}

function hideBanner() {
    bannerAlert.classList.add('-translate-y-12', 'opacity-0');
}

function recordMove(piece, fromX, fromZ, toX, toZ, isCapture) {
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const moveText = `${piece.color.toUpperCase()} ${piece.type}: ${cols[fromX]}${rows[fromZ]} ${isCapture ? '⚔️' : '→'} ${cols[toX]}${rows[toZ]}`;
    moveHistory.push(moveText);

    if (moveHistory.length === 1) moveLog.innerHTML = '';

    const entry = document.createElement('div');
    entry.className = 'flex items-center justify-between p-1.5 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300';
    entry.innerHTML = `<span><strong class="text-indigo-400">#${moveHistory.length}</strong> ${moveText}</span>`;
    moveLog.appendChild(entry);
    moveLog.scrollTop = moveLog.scrollHeight;

    moveCount.textContent = `${moveHistory.length} lances`;
}

function flipCamera() {
    const targetAngle = camera.position.z > 0 ? -Math.PI : 0;
    const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
    const startAngle = Math.atan2(camera.position.x, camera.position.z);

    const duration = 800;
    const startTime = performance.now();

    activeAnimations.push({
        update: (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
            const currentAngle = startAngle + (targetAngle - startAngle) * ease;

            camera.position.x = Math.sin(currentAngle) * radius;
            camera.position.z = Math.cos(currentAngle) * radius;
            controls.update();

            return progress < 1;
        }
    });
}

function resetGame() {
    isGameOver = false;
    isCheck = false;
    currentTurn = 'w';
    moveHistory = [];
    enPassantTarget = null;
    pendingPromotion = null;

    particles.forEach(p => scene.remove(p.mesh));
    confettiParticles.forEach(c => scene.remove(c.mesh));
    particles = [];
    confettiParticles = [];

    moveLog.innerHTML = `<div class="text-slate-500 italic text-center py-4">Aguardando o primeiro movimento...</div>`;
    moveCount.textContent = `0 lances`;

    hideBanner();
    updateTurnUI();
    setupInitialPieces();
    clearSelection();
}

// TECLADO
const keysPressed = {};
window.addEventListener('keydown', (e) => keysPressed[e.key] = true);
window.addEventListener('keyup', (e) => keysPressed[e.key] = false);

function handleKeyboardControls() {
    const rotSpeed = 0.02;
    if (keysPressed['ArrowLeft']) {
        const x = camera.position.x, z = camera.position.z;
        camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
        camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
    }
    if (keysPressed['ArrowRight']) {
        const x = camera.position.x, z = camera.position.z;
        camera.position.x = x * Math.cos(-rotSpeed) + z * Math.sin(-rotSpeed);
        camera.position.z = z * Math.cos(-rotSpeed) - x * Math.sin(-rotSpeed);
    }
    if (keysPressed['ArrowUp'] && camera.position.y > 3) camera.position.y -= 0.15;
    if (keysPressed['ArrowDown'] && camera.position.y < 18) camera.position.y += 0.15;
}

// LOOP DE RENDERIZAÇÃO
function animate(now = performance.now()) {
    requestAnimationFrame(animate);

    handleKeyboardControls();
    controls.update();

    activeAnimations = activeAnimations.filter(anim => anim.update(now));

    particles = particles.filter(p => {
        p.velocity.y -= 0.18;
        p.mesh.position.addScaledVector(p.velocity, 0.016);
        p.life -= 0.02;
        p.mesh.scale.multiplyScalar(0.95);

        if (p.life <= 0) {
            scene.remove(p.mesh);
            return false;
        }
        return true;
    });

    confettiParticles.forEach(c => {
        c.mesh.position.addScaledVector(c.velocity, 0.016);
        c.mesh.rotation.x += c.rotSpeed.x * 0.016;
        c.mesh.rotation.y += c.rotSpeed.y * 0.016;
        if (c.mesh.position.y < 0) c.mesh.position.y = 10;
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const width = container.clientWidth || (window.innerWidth - 288);
    const height = container.clientHeight || (window.innerHeight - 60);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.onload = init3D;