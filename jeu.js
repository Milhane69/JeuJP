// --- CONFIGURATION DE L'ESPACE ---
const playground = {
    dom: document.getElementById("playground"),
    get width() { return this.dom.getBoundingClientRect().width; },
    get height() { return this.dom.getBoundingClientRect().height; }
};

const ui = {
    scoreDom: document.getElementById("score"),
    countDom: document.getElementById("enemy-count")
};

// --- LE JOUEUR (Physique & Contrôles) ---
const player = {
    dom: document.getElementById("sprite"),
    x: 100,
    y: 100,
    vx: 0, 
    vy: 0, 
    size: 40, // Doit correspondre au CSS
    speed: 1.8,     // Force de l'accélération
    friction: 0.90, // Plus faible pour plus de glisse (fun)

    update: function() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= this.friction; this.vy *= this.friction;

        // Limites du terrain
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.y < 0) { this.y = 0; this.vy = 0; }
        if (this.x + this.size > playground.width) { this.x = playground.width - this.size; this.vx = 0; }
        if (this.y + this.size > playground.height) { this.y = playground.height - this.size; this.vy = 0; }

        this.dom.style.left = this.x + "px";
        this.dom.style.top = this.y + "px";
    }
};

// --- CLASSE ENNEMI (Pour en créer plusieurs) ---
class Enemy {
    constructor() {
        // Apparition aléatoire sur les bords pour ne pas spawner sur le joueur
        if (Math.random() > 0.5) {
            this.x = Math.random() > 0.5 ? -50 : playground.width + 50;
            this.y = Math.random() * playground.height;
        } else {
            this.x = Math.random() * playground.width;
            this.y = Math.random() > 0.5 ? -50 : playground.height + 50;
        }
        
        this.size = 40; // Doit correspondre au CSS
        this.speed = 1.5 + (Math.random() * 1.0); // Vitesse légèrement aléatoire par ennemi

        // Création de l'élément DOM
        this.dom = document.createElement('div');
        this.dom.className = 'enemy';
        playground.dom.appendChild(this.dom);
    }

    // IA de poursuite
    update(targetX, targetY) {
        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        this.dom.style.left = this.x + "px";
        this.dom.style.top = this.y + "px";
    }

    // Retourne la zone de collision (hitbox)
    getBounds() {
        return {
            left: this.x, right: this.x + this.size,
            top: this.y, bottom: this.y + this.size
        };
    }
}

// --- LOGIQUE DU JEU (Manager) ---
const game = {
    isRunning: false,
    score: 0,
    enemies: [], // Liste de tous les ennemis présents
    keys: {}, 
    
    lastSpawnTime: 0, // Chrono pour l'apparition
    spawnInterval: 10000, // Toutes les 10 secondes (10000 ms)

    start: function() {
        this.isRunning = true;
        this.score = 0;
        this.enemies = [];
        player.x = playground.width / 2; player.y = playground.height / 2; // Centre le joueur
        
        // Créer le premier ennemi
        this.enemies.push(new Enemy());
        
        this.lastSpawnTime = Date.now(); // Initialise le chrono
        this.loop();
    },

    stop: function() {
        this.isRunning = false;
        alert("CRASH DU SYSTÈME !\nNiveau de survie : " + Math.floor(this.score));
        location.reload(); 
    },

    checkCollisions: function() {
        const pBounds = {
            left: player.x, right: player.x + player.size,
            top: player.y, bottom: player.y + player.size
        };

        // On teste contre CHAQUE ennemi
        for (let e of this.enemies) {
            const eBounds = e.getBounds();

            // Algorithme de collision AABB (boîtes alignées)
            if (pBounds.right > eBounds.left && 
                pBounds.left < eBounds.right && 
                pBounds.bottom > eBounds.top && 
                pBounds.top < eBounds.bottom) {
                this.stop(); // Collision détectée
                break; // Pas besoin de tester les autres
            }
        }
    },

    handleInput: function() {
        if (this.keys["Z"])    player.vy -= player.speed;
        if (this.keys["Q"])  player.vy += player.speed;
        if (this.keys["S"])  player.vx -= player.speed;
        if (this.keys["D"]) player.vx += player.speed;
    },

    loop: function() {
        if (!this.isRunning) return;

        this.handleInput();
        player.update();

        // Mettre à jour tous les ennemis
        for (let e of this.enemies) {
            e.update(player.x, player.y);
        }

        this.checkCollisions();

        // Gestion du score
        this.score += 0.05;
        ui.scoreDom.innerText = Math.floor(this.score);
        ui.countDom.innerText = this.enemies.length;

        // --- NOUVEAU : Logique d'apparition (Spawn) ---
        let now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.enemies.push(new Enemy()); // Ajouter un ennemi
            this.lastSpawnTime = now; // Reset chronomètre
            this.spawnInterval *= 0.98; // Optionnel : accélère le rythme d'apparition !
            console.log("Nouvel ennemi ! Total: " + this.enemies.length);
        }

        window.requestAnimationFrame(() => this.loop());
    }
};

// --- ECOUTEURS DE TOUCHES ---
window.addEventListener("keydown", (e) => game.keys[e.key] = true);
window.addEventListener("keyup", (e) => game.keys[e.key] = false);

// LANCEMENT
// Attendre que le playground soit chargé pour connaître ses dimensions
window.onload = () => game.start();
