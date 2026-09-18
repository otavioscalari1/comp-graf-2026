// Pega o elemento canvas do HTML
const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

let tempo = 0; // Variável para controlar a passagem do tempo na animação

function desenharRobo() {
    // 1. Limpar a tela a cada frame para não deixar rastros
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // O tempo avança um pouquinho a cada frame
    tempo += 0.05;

    // 2. Cálculos de movimento
    // Braços: balançam (rotação como um pêndulo)
    const rotacaoBraco = Math.sin(tempo) * 0.8; 
    
    // Pernas: sobem e descem (linear). 
    // Usamos Math.PI para que uma suba enquanto a outra desce
    const movimentoPernaEsq = Math.sin(tempo) * 15; 
    const movimentoPernaDir = Math.sin(tempo + Math.PI) * 15; 

    // Posição base do robô no centro da tela
    const centroX = 200;
    const centroY = 150;

    // 3. Desenhar Cabeça (Quadrado azul)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(centroX - 25, centroY - 60, 50, 50);

    // 4. Desenhar Corpo (Retângulo vermelho)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(centroX - 40, centroY, 80, 100);

    // 5. Desenhar Pernas (Retângulos cinzas - Movimento Vertical)
    ctx.fillStyle = '#7f8c8d';
    // Perna esquerda (posição Y varia)
    ctx.fillRect(centroX - 35, centroY + 100 + movimentoPernaEsq, 20, 60);
    // Perna direita (posição Y varia no sentido oposto)
    ctx.fillRect(centroX + 15, centroY + 100 + movimentoPernaDir, 20, 60);

    // 6. Desenhar Braços (Retângulos laranjas - Movimento de Rotação)
    ctx.fillStyle = '#e67e22';

    // Braço Esquerdo
    ctx.save(); // Salva o estado normal da tela
    ctx.translate(centroX - 40, centroY + 10); // Move o eixo para o "ombro" esquerdo
    ctx.rotate(rotacaoBraco); // Gira o eixo
    ctx.fillRect(-20, 0, 20, 70); // Desenha o braço
    ctx.restore(); // Desfaz a rotação para desenhar o resto normalmente

    // Braço Direito
    ctx.save(); 
    ctx.translate(centroX + 40, centroY + 10); // Move o eixo para o "ombro" direito
    ctx.rotate(-rotacaoBraco); // Gira o eixo na direção contrária
    ctx.fillRect(0, 0, 20, 70); // Desenha o braço
    ctx.restore(); 

    // Chama a função repetidamente para criar a animação
    requestAnimationFrame(desenharRobo);
}

// Dá o play na animação pela primeira vez
desenharRobo();