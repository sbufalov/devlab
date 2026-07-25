import { state } from './state.js';

const canvas = document.getElementById('texture-canvas');
const ctx = canvas.getContext('2d');

let points = [];
let animationId = null;
const mouse = { x: null, y: null, radius: 256 };

const colors = [
    '0, 229, 255',
    '140, 20, 200',
    '200, 20, 100',
    '130, 102, 237',
    '10, 40, 120'
];

// === PARTICLE CLASS ===
class Point {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.sizePhase = Math.random() * Math.PI * 2;
        this.sizeSpeed = 0.015 + Math.random() * 0.02;
        this.color = colors[0];
        this.isBlinking = false;
        this.blinkTimer = Math.floor(Math.random() * 300);
        this.isSquare = Math.random() > 0.7;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        
        // Pulsing size
        this.sizePhase += this.sizeSpeed;
        this.currentSize = this.baseSize * (1 + 0.2 * Math.sin(this.sizePhase));
        
        // Random color blinking
        if (this.blinkTimer > 0) {
            this.blinkTimer--;
        } else {
            this.isBlinking = !this.isBlinking;
            if (this.isBlinking) {
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.blinkTimer = 30 + Math.random() * 60;
            } else {
                this.color = colors[0];
                this.blinkTimer = 200 + Math.random() * 400;
            }
        }
        
        // Mouse repulsion
        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                this.x -= (dx / dist) * force * 0.8;
                this.y -= (dy / dist) * force * 0.8;
            }
        }
    }
    
    draw() {
        ctx.beginPath();
        
        if (this.isSquare) {
            ctx.rect(
                this.x - this.currentSize,
                this.y - this.currentSize,
                this.currentSize * 2,
                this.currentSize * 2
            );
        } else {
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
        }
        
        ctx.fillStyle = `rgba(${this.color}, ${this.isBlinking ? 0.9 : 0.5})`;
        ctx.fill();
    }
}

// === DRAW CONNECTING LINES ===
function drawLines() {
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dx = points[i].x - points[j].x;
            const dy = points[i].y - points[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 180) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                
                const opacity = 0.2 * (1 - dist / 180);
                ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }
}

// === ANIMATION LOOP ===
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    points.forEach(point => {
        point.update();
        point.draw();
    });
    
    drawLines();
    
    animationId = requestAnimationFrame(animate);
}

// === INITIALIZE PARTICLES ===
export function initParticles() {
    // Cancel previous animation if running
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Resize canvas
    resizeCanvas();
    
    // Create particles
    const density = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--particle-density')
    ) || state.particleDensity;
    
    points = [];
    for (let i = 0; i < density; i++) {
        points.push(new Point());
    }
    
    // Start animation
    animate();
}

// === RESIZE CANVAS ===
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// === EVENT LISTENERS ===
window.addEventListener('resize', () => {
    resizeCanvas();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});
