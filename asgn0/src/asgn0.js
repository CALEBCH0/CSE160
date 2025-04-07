// DrawRectangle.js
function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');

    // Set black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set v1
    let v1 = new Vector3([2.25, 2.25, 0.0]);

    // Draw v1
    drawVector(ctx, v1, 'red');
}

function drawVector(ctx, v, color) {
    let x = v.elements[0];
    let y = v.elements[1];

    // Scale by 20
    x *= 20;
    y *= 20;

    // origin at the center of canvs
    const originX = 200;
    const originY = 200;

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX+x, originY-y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

