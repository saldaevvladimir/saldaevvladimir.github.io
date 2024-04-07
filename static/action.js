
(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
    window.requestAnimationFrame = requestAnimationFrame;
})();

// Terrain stuff.
var background = document.getElementById("bgCanvas"),
    bgCtx = background.getContext("2d"),
    width = window.innerWidth,
    height = document.body.offsetHeight;

(height < 400) ? height = 400 : height;

background.width = width;
background.height = height;

function Terrain(options) {
    options = options || {};
    this.terrain = document.createElement("canvas");
    this.terCtx = this.terrain.getContext("2d");
    this.scrollDelay = options.scrollDelay || 90;
    this.lastScroll = new Date().getTime();

    this.terrain.width = width;
    this.terrain.height = height;
    this.fillStyle = options.fillStyle || "#191D4C";
    this.mHeight = options.mHeight || height;

    // generate
    this.points = [];

    var displacement = options.displacement || 140,
        power = Math.pow(2, Math.ceil(Math.log(width) / (Math.log(2))));

    // set the start height and end height for the terrain
    this.points[0] = this.mHeight;//(this.mHeight - (Math.random() * this.mHeight / 2)) - displacement;
    this.points[power] = this.points[0];

    // create the rest of the points
    for (var i = 1; i < power; i *= 2) {
        for (var j = (power / i) / 2; j < power; j += power / i) {
            this.points[j] = ((this.points[j - (power / i) / 2] + this.points[j + (power / i) / 2]) / 2) + Math.floor(Math.random() * -displacement + displacement);
        }
        displacement *= 0.6;
    }

    document.body.appendChild(this.terrain);
}

Terrain.prototype.update = function () {
    // draw the terrain
    this.terCtx.clearRect(0, 0, width, height);
    this.terCtx.fillStyle = this.fillStyle;

    if (new Date().getTime() > this.lastScroll + this.scrollDelay) {
        this.lastScroll = new Date().getTime();
        this.points.push(this.points.shift());
    }

    this.terCtx.beginPath();
    for (var i = 0; i <= width; i++) {
        if (i === 0) {
            this.terCtx.moveTo(0, this.points[0]);
        } else if (this.points[i] !== undefined) {
            this.terCtx.lineTo(i, this.points[i]);
        }
    }

    this.terCtx.lineTo(width, this.terrain.height);
    this.terCtx.lineTo(0, this.terrain.height);
    this.terCtx.lineTo(0, this.points[0]);
    this.terCtx.fill();
}


// Second canvas used for the stars
bgCtx.fillStyle = '#05004c';//'#05004c'
bgCtx.fillRect(0, 0, width, height);

// stars
function Star(options) {
    this.size = Math.random() * 2;
    this.speed = Math.random() * .05;
    this.x = options.x;
    this.y = options.y;
    this.color = '#ffffff';
}

Star.prototype.reset = function () {
    this.size = Math.random() * 2;
    this.speed = Math.random() * .05;
    this.x = width;
    this.y = Math.random() * height;
}

Star.prototype.update = function () {
    this.x -= this.speed;
    if (this.x < 0) {
        this.reset();
    } else {
        bgCtx.fillStyle = this.color;
        bgCtx.fillRect(this.x, this.y, this.size, this.size);

        if (!this.blinking && Math.random() < 0.0004) {
            this.blinking = true;
            var originalColor = this.color;
            this.color = '#221c32'; //

            var self = this;
            setTimeout(function () {
                self.color = originalColor;
                self.blinking = false;

                var sizeMultiplier = getRandomSizeMultiplier();
                this.size *= sizeMultiplier;

                setTimeout(function () {
                    this.size /= sizeMultiplier;
                }, 100);
            }, 3000);
        }
    }
}

function ShootingStar() {
    this.reset();
}

ShootingStar.prototype.reset = function () {
    this.x = Math.random() * width;
    this.y = 0;
    this.len = (Math.random() * 80) + 10;
    this.speed = (Math.random() * 10) + 6;
    this.size = (Math.random() * 1) + 0.1;
    // this is used so the shooting stars arent constant
    this.waitTime = new Date().getTime() + (Math.random() * 3000) + 500;
    this.active = false;
}

ShootingStar.prototype.update = function () {
    if (this.active) {
        this.x -= this.speed;
        this.y += this.speed;
        if (this.x < 0 || this.y >= height) {
            this.reset();
        } else {
            bgCtx.lineWidth = this.size;
            bgCtx.beginPath();
            bgCtx.moveTo(this.x, this.y);
            bgCtx.lineTo(this.x + this.len, this.y - this.len);
            bgCtx.stroke();
        }
    } else {
        if (this.waitTime < new Date().getTime()) {
            this.active = true;
        }
    }
}

var entities = [];

for (var i = 0; i < height; i++) {
    entities.push(new Star({
        x: Math.random() * width,
        y: Math.random() * height
    }));
}

for (var i = 0; i < 8; i++) {
    entities.push(new ShootingStar());
}
entities.push(new Terrain({ mHeight: (height / 2) - 120 }));
entities.push(new Terrain({ displacement: 120, scrollDelay: 50, fillStyle: "rgb(17,20,40)", mHeight: (height / 2) - 60 }));
entities.push(new Terrain({ displacement: 100, scrollDelay: 20, fillStyle: "rgb(10,10,5)", mHeight: height / 2 }));

function fadeIn(element, duration) {
    return new Promise(function (resolve) {
        var start = window.performance.now();
        var initialOpacity = parseFloat(element.style.opacity);
        var targetOpacity = 1;

        function updateOpacity(timestamp) {
            var elapsed = timestamp - start;
            var progress = elapsed / duration;

            if (progress > 1) {
                progress = 1;
            }

            var opacity = initialOpacity + (targetOpacity - initialOpacity) * progress;
            element.style.opacity = opacity;

            if (progress < 1) {
                window.requestAnimationFrame(updateOpacity);
            } else {
                resolve();
                blinking = false;
            }
        }

        window.requestAnimationFrame(updateOpacity);
    });
}

var maxBlinkDistance = 30;
var blinking = false;

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getRandomSizeMultiplier() {
    return Math.random() * 0.7 + 1.0;
}

document.addEventListener('mousemove', function (event) {
    var x = event.clientX;
    var y = event.clientY;

    for (var i = 0; i < entities.length; i++) {
        var star = entities[i];
        var distance = getDistance(x, y, star.x, star.y);

        if (distance <= maxBlinkDistance) {
            if (star.color == '#ffffff') {
                star.color = '#00ff00';//'#221c32'
                var sizeMultiplier = getRandomSizeMultiplier();
                star.size *= sizeMultiplier;

                (function (star) {
                    setTimeout(function () {
                        star.color = '#ffffff';
                        star.size /= sizeMultiplier;
                    }, 500);
                })(star);
            }
        }
    }
});


function animate() {
    bgCtx.fillStyle = '#110E19';
    bgCtx.fillRect(0, 0, width, height);
    bgCtx.fillStyle = '#ffffff';
    bgCtx.strokeStyle = '#ffffff';

    var entLen = entities.length;

    while (entLen--) {
        entities[entLen].update();
    }
    requestAnimationFrame(animate);
}

animate();
