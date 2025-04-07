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

function handleDrawEvent() {
    const x1 = parseFloat(document.getElementById("v1X").value);
    const y1 = parseFloat(document.getElementById("v1Y").value);

    const x2 = parseFloat(document.getElementById("v2X").value);
    const y2 = parseFloat(document.getElementById("v2Y").value);

    if (isNaN(x1) || isNaN(y1)) {
        alert("Please enter valid x and y for v1.");
        return;
    }

    if (isNaN(x2) || isNaN(y2)) {
        alert("Please enter valid x and y for v2.");
        return;
    }
    
    const canvas = document.getElementById("example");
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // create and draw vectors
    let v1 = new Vector3([x1, y1, 0.0]);
    let v2 = new Vector3([x2, y2, 0.0]);
    drawVector(ctx, v1, 'red');
    drawVector(ctx, v2, 'blue');
}

function handleDrawOperationEvent() {
    const canvas = document.getElementById("example");
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Read operation and scalar
    const operation = document.getElementById("operation").value;
    const scalar = parseFloat(document.getElementById("scalar").value);

    if (isNaN(scalar)) {
        alert("Please enter a valid scalar.");
        return;
    }

    // Create original vectors
    const x1 = parseFloat(document.getElementById("v1X").value);
    const y1 = parseFloat(document.getElementById("v1Y").value);
    const x2 = parseFloat(document.getElementById("v2X").value);
    const y2 = parseFloat(document.getElementById("v2Y").value);

    if (isNaN(x1) || isNaN(y1)) {
        alert("Please enter valid x and y for v1.");
        return;
    } else if (isNaN(x2) || isNaN(y2)) {
        alert("Please enter valid x and y for v2.");
        return;
    }

    let v1 = new Vector3([x1, y1, 0.0]);
    let v2 = new Vector3([x2, y2, 0.0]);

    if (operation === 'add' || operation === 'sub') {
        const v3 = new Vector3(v1.elements);
        operation === 'add' ? v3.add(v2) : v3.sub(v2);
        drawVector(ctx, v3, 'green');
        // Draw original vectors
        drawVector(ctx, v1, 'red');
        drawVector(ctx, v2, 'blue');
    } else if (operation === 'div') {
        const v3 = new Vector3(v1.elements);
        const v4 = new Vector3(v2.elements);
        v3.div(scalar);
        v4.div(scalar);
        // Draw original vectors
        drawVector(ctx, v1, 'red');
        drawVector(ctx, v2, 'blue');

        drawVector(ctx, v3, 'green');
        drawVector(ctx, v4, 'green');
        return;
    } else if (operation === 'mul') {
        const v3 = new Vector3(v1.elements);
        const v4 = new Vector3(v2.elements);
        v3.mul(scalar);
        v4.mul(scalar);
        drawVector(ctx, v3, 'green');
        drawVector(ctx, v4, 'green');
        // Draw original vectors
        drawVector(ctx, v1, 'red');
        drawVector(ctx, v2, 'blue');
    } else if (operation === 'magnitude') {
        console.log("Magnitude of v1:", v1.magnitude());
        console.log("Magnitude of v2:", v2.magnitude());
    } else if (operation === 'normalize') {
        // Draw original vectors
        drawVector(ctx, v1, 'red');
        drawVector(ctx, v2, 'blue');
        const v1Norm = new Vector3(v1.elements).normalize();
        const v2Norm = new Vector3(v2.elements).normalize();
        drawVector(ctx, v1Norm, 'green');
        drawVector(ctx, v2Norm, 'green');
    }

}
