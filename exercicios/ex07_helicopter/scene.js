// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {
        this.renderer = new Renderer(gl, program);

        // Figuras que serão exibidas
        this.helicopterBody = new HelicopterBody();
        this.helicopterTopShaft = new HelicopterTopShaft();
        this.helicopterTail = new HelicopterTail();
        this.helicopterPropellers = new HelicopterPropellers();
        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // Posição global do helicóptero
        this.tx = 0.0;
        this.ty = 0.0;

        // Ângulos das hélices
        this.propAngle = 0.0;
        this.tailPropAngle = 0.0;

        // Escuta os eventos do teclado para movimentação
        window.addEventListener("keydown", (event) => {
            const speed = 0.05;
            switch(event.key) {
                case "ArrowUp":
                    this.ty += speed;
                    break;
                case "ArrowDown":
                    this.ty -= speed;
                    break;
                case "ArrowLeft":
                    this.tx -= speed;
                    break;
                case "ArrowRight":
                    this.tx += speed;
                    break;
            }
        });
    }

    update() {
        // Incrementa a rotação das hélices continuamente
        this.propAngle += 0.2;
        this.tailPropAngle += 0.4;

        // 1. Matriz de translação global (movimenta as partes fixas do helicóptero)
        let baseTransform = m4.translation(this.tx, this.ty, 0);

        this.helicopterBody.update(baseTransform);
        this.helicopterTopShaft.update(baseTransform);
        this.helicopterTail.update(baseTransform);

        // 2. Hélice Principal: Inicia da identidade, rotaciona no eixo Y, depois aplica a translação global
        let propTransform = m4.identity();
        propTransform = m4.yRotate(propTransform, this.propAngle);
        propTransform = m4.translate(propTransform, this.tx, this.ty, 0);
        
        this.helicopterPropellers.update(propTransform);

        // 3. Hélice da Cauda: Inicia da identidade
        let tailTransform = m4.identity();
        // Passo A: Move o centro da hélice (desenhada em X=0.7, Y=0, Z=0.06) para a origem
        tailTransform = m4.translate(tailTransform, -0.7, 0, -0.06); 
        // Passo B: Rotaciona a hélice ao redor do eixo Z enquanto está na origem
        tailTransform = m4.zRotate(tailTransform, this.tailPropAngle);
        // Passo C: Retorna a hélice para sua posição local na cauda do helicóptero
        tailTransform = m4.translate(tailTransform, 0.7, 0, 0.06);
        // Passo D: Aplica a mesma movimentação global (teclado) usada no restante do corpo
        tailTransform = m4.translate(tailTransform, this.tx, this.ty, 0);
        
        this.helicopterTailPropeller.update(tailTransform);
    }

    draw() {
        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(this.renderer.program);

        this.helicopterBody.draw(this.renderer);
        this.helicopterTopShaft.draw(this.renderer);
        this.helicopterTail.draw(this.renderer);
        this.helicopterPropellers.draw(this.renderer);
        this.helicopterTailPropeller.draw(this.renderer);
    }

    execute() {
        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {
        requestAnimationFrame(
            () => this.execute()
        );
    }
}