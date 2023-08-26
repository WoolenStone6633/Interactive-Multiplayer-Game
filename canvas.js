//Initial Setup
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const restartGameButton = document.querySelector('#restartGameButton');
const restartScreen = document.querySelector('#restartScreen');
const restartScreenText = document.querySelector('#restartScreenText');
const nameScreen = document.querySelector('#nameScreen');
const nameInput = document.querySelector('#nameInput');
const submitButton = document.querySelector('#submitButton');
restartScreen.style.display = 'none';

//Variables
const mouse = {
    x: innerWidth / 2,
    y: innerHeight / 2
};
let userName = "";

const colors = ['#2185c5', '#7ecefd', '#fff6e5', '#ff7f66'];
const names = ["Bob", "Lary", "Suzy", "Stacey", "Linda", "Ronnie", "Stewart", "Brenda", "Kevin", "Dave", "vicky", "bionca"];

//multiplicationFactor is used to calibrate the game depending on the displays refreshrate
const multiplicationFactor = 2;
const gravity = 0.23 * multiplicationFactor;
const yFriction = 0.85;
const xFriction = 0.995;

//Event Listeners

restartGameButton.addEventListener('click', function() {
    restartScreen.style.display = 'none';
    init();
});

submitButton.addEventListener('click', function() {
    if (nameInput.userName != "") {
        userName = nameInput.value;
        init();
        animate();
        nameScreen.style.display = 'none';
    } else {
        console.log("error");
    }
});

let particleClicked = -1;
//Click and drag around any particle
addEventListener('mousedown', function() {
    for (let i = 0; i < particles.length; i++) {
        if (distance(particles[i].x, particles[i].y, mouse.x, mouse.y) < particles[i].radius) {
            particleClicked = i;
        }
    }

    if (particleClicked != -1) { 
        particles[particleClicked].click = true;
        particles[particleClicked].velocity.x = 0;
        particles[particleClicked].velocity.y = 0;
        particles[particleClicked].gravEffect = false;
    }

});

var time = 20; 
var prevMouseX;
var prevMouseY;
var tracker = setInterval(function() {
    speedX = (mouse.x - prevMouseX) / time * 4.5;
    speedY = (mouse.y - prevMouseY) / time * 4.5;
    prevMouseX = mouse.x;
    prevMouseY = mouse.y;
}, time);

var speedX;
var speedY;
addEventListener('mousemove', function(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    if (particleClicked != -1 && (mouse.x - particles[particleClicked].radius > 0 && mouse.x + particles[particleClicked].radius < canvas.width) && (mouse.y - particles[particleClicked].radius > 0 && mouse.y + particles[particleClicked].radius < canvas.height)) {
        particles[particleClicked].x = mouse.x;
        particles[particleClicked].y = mouse.y;
        particles[particleClicked].velocity.x = 0;
        particles[particleClicked].velocity.y = 0;
    }
});

addEventListener('mouseup', function() {
    if (particleClicked != -1) {
        particles[particleClicked].click = false;
        particles[particleClicked].velocity.x = speedX * multiplicationFactor;
        particles[particleClicked].velocity.y = speedY * multiplicationFactor;
        particles[particleClicked].gravEffect = true;
        particleClicked = -1;
    }
});

addEventListener('resize', function() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    init();
});


//Utility Functions
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}

//Returns the distance between two points
function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

/**
 * Rotates coordinate system for velocities
 *
 * Takes velocities and alters them as if the coordinate system they're on was rotated
 *
 * @param  Object | velocity | The velocity of an individual particle
 * @param  Float  | angle    | The angle of collision between two objects in radians
 * @return Object | The altered x and y velocities after the coordinate system has been rotated
 */

 function rotate(velocity, angle) {
    const rotatedVelocities = {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };

    return rotatedVelocities;
}

/**
 * Swaps out two colliding particles' x and y velocities after running through
 * an elastic collision reaction equation
 *
 * @param  Object | particle      | A particle object with x and y coordinates, plus velocity
 * @param  Object | otherParticle | A particle object with x and y coordinates, plus velocity
 * @return Null | Does not return a value
 */

function resolveCollision(particle, otherParticle) {
    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.x - particle.x;
    const yDist = otherParticle.y - particle.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        // Grab angle between the two colliding particles
        const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);

        // Store mass in var for better readability in collision equation
        const m1 = particle.mass;
        const m2 = otherParticle.mass;

        // Velocity before equation
        const u1 = rotate(particle.velocity, angle);
        const u2 = rotate(otherParticle.velocity, angle);

        // Velocity after 1d collision equation
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y };

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        // Swap particle velocities for realistic bounce effect
        particle.velocity.x = vFinal1.x;
        particle.velocity.y = vFinal1.y;

        otherParticle.velocity.x = vFinal2.x;
        otherParticle.velocity.y = vFinal2.y;
    }
}

function goalCollision(goal, particle, damper) {
    let vCollision = {x: goal.x - particle.x, y: goal.y - particle.y};
    let dist = distance(goal.x, goal.y, particle.x, particle.y)
    let vCollisionNorm = {x: vCollision.x / dist, y: vCollision.y / dist};
    let vRelativeVelocity = {x: -particle.velocity.x, y: -particle.velocity.y};
    let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
    particle.velocity.x = (speed * vCollisionNorm.x) * damper;
    particle.velocity.y = (speed * vCollisionNorm.y) * damper;
}

function won(particle) {
    if (particle.counter >= 3) {
        particle.velocity.x = 0;
        particle.velocity.y = 0;
        particle.gravEffect = false;
        particle.counter = 0;
        restartScreen.style.display = 'flex';
        restartScreenText.innerHTML = particle.name + " Won!!";
        return true;
    } else {
        return false;
    }
}

//Objects
function Particle(x, y, radius, color, name, gravEffect) {
    this.x = x;
    this.y = y;
    this.velocity = {   
        x: randomInt(-6, 6),
        y: randomInt(-6, 6)
    }
    this.radius = radius;
    this.color = color;
    this.mass = 1;
    this.name = name;
    this.gravEffect = gravEffect;
    this.counter = 0;

    this.update = function(particles) {
        this.draw();
        for (let i = 0; i < particles.length; i++) {
            if (this == particles[i]) {
                continue;
            }
            
            if (distance(this.x, this.y, particles[i].x, particles[i].y) < this.radius + particles[i].radius && this.gravEffect && particles[i].gravEffect) {
                resolveCollision(this, particles[i]);
            }
        }

        if (this.x - this.radius <= 0 || this.x + this.radius + this.velocity.x >= canvas.width) {
            this.velocity.x = -this.velocity.x;
        } else if (this.y + radius + this.velocity.y >= canvas.height) {
            this.velocity.x = this.velocity.x * xFriction;
        }

        if (this.y - this.radius + this.velocity.y <= 0 || this.y + this.radius + this.velocity.y >= canvas.height && this.name == userName) {
            this.velocity.y = -this.velocity.y * yFriction;
        } else if (this.y - this.radius + this.velocity.y <= 0 || this.y + this.radius + this.velocity.y >= canvas.height) {
            this.velocity.y = -this.velocity.y
        }else if (this.gravEffect) {
            this.velocity.y += gravity;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    };

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2 , false);
        c.strokeStyle = this.color;
        c.stroke();
        c.closePath();
        c.fillStyle = 'black';
        c.textAlign = 'center';
        c.font = '25px sans-serif';
        c.fillText(this.name, this.x, this.y - this.radius * 1.3);
    };
}

//Goal class
function Goal(x, y) {
    this.x = x;
    this.y = y;
    this.goalRadius = 100;
    this.colorPrimary = 'rgba(255, 0, 0, 0.2)';
    this.colorSecondary = 'red';
    this.opening = Math.PI * 0.30;
    //Change these 2 variables if the opening is changed
    this.openSideEdge = 75;
    this.openingBottomEdge = 10;
    this.mass = 1;

    this.update = function(particles) {
        this.draw();
        for (let i = 0; i < particles.length; i++) {
            if (particles[i].x - particles[i].radius >= this.x - this.openSideEdge && particles[i].x + particles[i].radius + particles[i].velocity.x <= this.x + this.openSideEdge && particles[i].y + particles[i].radius + particles[i].velocity.y <= this.y - this.openingBottomEdge) {
                this.colorSecondary = 'cyan';
            } else if (distance(this.x, this.y, particles[i].x, particles[i].y) < this.goalRadius + particles[i].radius && distance(this.x, this.y, particles[i].x, particles[i].y) > this.goalRadius - particles[i].radius - 15) {
                if (distance(this.x, this.y, particles[i].x, particles[i].y) < this.goalRadius - particles[i].radius) {
                    this.colorSecondary = 'green';
                    goalCollision(this, particles[i], 0.6);
                    particles[i].counter++;
                } else {
                    this.colorSecondary = 'blue';
                    goalCollision(this, particles[i], 1);
                }
            }
            else {
                this.colorSecondary = 'red';
            }

            if (won(particles[i])) {
                console.log('Player won!!')
            }
        }
    }

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, this.goalRadius, 0 - this.opening, Math.PI + this.opening, false);
        c.fillStyle = this.colorPrimary;
        c.fill();
        c.strokeStyle = this.colorSecondary;
        c.stroke();
        c.closePath();
    }
}


//Implementation (max 12)
let goal
let particles;
const amount = 12;
const radius = 20;
const color = 'blue';

function init() {
    goal = new Goal(canvas.width / 2, canvas.height / 2);
    particles = [];

    particles.push(new Particle(canvas.width / 2 + 200, canvas.height / 2, radius, 'cyan', userName, true))

    for (let i = 0; i < amount; i++) {
        let x = randomInt(radius, canvas.width - radius);
        let y = randomInt(radius + 100 +canvas.height / 2, canvas.height - radius);

        //Checks to see if 2 particles are touching. If they are the two particles are redrawn somewhere else
        if (i != 0) {
            for (let j = 0; j < particles.length; j++) {
                if (distance(x, y, particles[j].x, particles[j].y) < radius + particles[j].radius) {
                    x = randomInt(radius, canvas.width - radius);
                    y = randomInt(radius + 100 +canvas.height / 2, canvas.height - radius);

                    j = -1;
                }
            }
        }

        particles.push(new Particle(x, y, radius, color, names[i], true));
        particles[i].counter = 0;
    }
}

//Animation Loop
function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    goal.update(particles);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update(particles);
    }
}