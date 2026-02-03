// MemeGen Application
class MemeGen {
    constructor() {
        this.canvas = document.getElementById('memeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentImage = null;
        this.textLayers = [];
        this.currentLang = 'en';
        this.templates = [];
        
        this.init();
    }

    init() {
        this.loadTemplates();
        this.setupEventListeners();
        this.setLanguage('en');
    }

    // Template images using data URLs (popular meme templates)
    loadTemplates() {
        this.templates = [
            { name: 'distracted-boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
            { name: 'drake', url: 'https://i.imgflip.com/30b1gx.jpg' },
            { name: 'two-buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
            { name: 'change-my-mind', url: 'https://i.imgflip.com/24y43o.jpg' },
            { name: 'expanding-brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
            { name: 'woman-yelling', url: 'https://i.imgflip.com/345v97.jpg' },
            { name: 'bernie', url: 'https://i.imgflip.com/3oevdk.jpg' },
            { name: 'galaxy-brain', url: 'https://i.imgflip.com/1h7in3.jpg' },
            { name: 'this-is-fine', url: 'https://i.imgflip.com/wxica.jpg' }
        ];
        this.renderTemplates();
    }

    renderTemplates() {
        const grid = document.getElementById('templatesGrid');
        const t = translations[this.currentLang];
        
        grid.innerHTML = this.templates.map((template, index) => `
            <div class="template-item" data-url="${template.url}" data-name="${t.templateNames[index] || template.name}">
                <img src="${template.url}" alt="${template.name}" loading="lazy" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23FFD93D%22 width=%22100%22 height=%22100%22/><text fill=%22%23000%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>😂</text></svg>'">
            </div>
        `).join('');

        grid.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadTemplate(item.dataset.url);
            });
        });
    }

    setupEventListeners() {
        // Upload
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');

        uploadArea.addEventListener('click', () => imageInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImage(file);
            }
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        // Text controls
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.addTextLayer();
        });

        // Download
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadMeme();
        });

        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetCanvas();
        });

        // Language selector
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLanguage(btn.dataset.lang);
            });
        });

        // Real-time text update
        ['topText', 'bottomText'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.drawMeme();
            });
        });

        ['fontSize', 'textColor', 'strokeColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.drawMeme();
            });
        });
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.drawMeme();
                this.hidePlaceholder();
                this.showToast(translations[this.currentLang].textAdded);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadTemplate(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.currentImage = img;
            this.drawMeme();
            this.hidePlaceholder();
        };
        img.onerror = () => {
            this.showToast('Failed to load template. Try uploading your own image!');
        };
        img.src = url;
    }

    hidePlaceholder() {
        document.getElementById('canvasPlaceholder').classList.add('hidden');
    }

    drawMeme() {
        if (!this.currentImage) return;

        const maxWidth = 600;
        const maxHeight = 600;
        let width = this.currentImage.width;
        let height = this.currentImage.height;

        // Calculate scaled dimensions
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        // Clear and draw image
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(this.currentImage, 0, 0, width, height);

        // Draw text
        const topText = document.getElementById('topText').value.toUpperCase();
        const bottomText = document.getElementById('bottomText').value.toUpperCase();
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const textColor = document.getElementById('textColor').value;
        const strokeColor = document.getElementById('strokeColor').value;

        this.drawText(topText, width / 2, fontSize + 20, fontSize, textColor, strokeColor, width);
        this.drawText(bottomText, width / 2, height - 20, fontSize, textColor, strokeColor, width);
    }

    drawText(text, x, y, fontSize, color, strokeColor, maxWidth) {
        if (!text) return;

        this.ctx.font = `bold ${fontSize}px Impact, Bangers, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = fontSize / 8;
        this.ctx.lineJoin = 'round';

        // Word wrap
        const words = text.split(' ');
        let line = '';
        const lines = [];

        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth - 40 && line !== '') {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Draw lines
        const lineHeight = fontSize * 1.2;
        const startY = y > this.canvas.height / 2 ? y - (lines.length - 1) * lineHeight : y;

        lines.forEach((line, i) => {
            const drawY = startY + i * lineHeight;
            this.ctx.strokeText(line.trim(), x, drawY);
            this.ctx.fillText(line.trim(), x, drawY);
        });
    }

    addTextLayer() {
        if (!this.currentImage) {
            this.showToast(translations[this.currentLang].noImage);
            return;
        }
        this.drawMeme();
        this.showToast(translations[this.currentLang].textAdded);
        this.fireConfetti();
    }

    downloadMeme() {
        if (!this.currentImage) {
            this.showToast(translations[this.currentLang].noImage);
            return;
        }

        const link = document.createElement('a');
        link.download = `memegen-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        this.showToast(translations[this.currentLang].downloadSuccess);
        this.fireConfetti();
    }

    resetCanvas() {
        if (confirm(translations[this.currentLang].resetConfirm)) {
            this.currentImage = null;
            this.textLayers = [];
            document.getElementById('topText').value = '';
            document.getElementById('bottomText').value = '';
            document.getElementById('canvasPlaceholder').classList.remove('hidden');
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.width = 0;
            this.canvas.height = 0;
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        const t = translations[lang];

        // Update buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update all translatable elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

        // Re-render templates with new names
        this.renderTemplates();
    }

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    fireConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#FFD93D', '#FF6B35', '#4CAF50', '#2196F3', '#E91E63'];
        const particles = [];

        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 100,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 20 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }

        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravity
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.y > canvas.height + 50) {
                    particles.splice(i, 1);
                }
            });

            if (particles.length > 0 && frame < 120) {
                frame++;
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        animate();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.memeGen = new MemeGen();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
