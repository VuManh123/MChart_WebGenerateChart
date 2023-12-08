// Lấy thẻ canvas và context
var canvas = document.getElementById('bubbleChart');
var ctx = canvas.getContext('2d');

// Số lượng bong bóng
var numBubbles = 150;

// Mảng chứa thông tin về các bong bóng
var bubbles = [];

// Khởi tạo thông tin của các bong bóng
for (var i = 0; i < numBubbles; i++) {
    bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 20 + 10,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 4 - 2,
        color: 'rgba(' + Math.random() * 255 + ',' + Math.random() * 255 + ',' + Math.random() * 255 + ',' + Math.random() + ')'
    });
}

// Tạo một biểu đồ dạng bong bóng với đường nối
var bubbleChart = new Chart(ctx, {
    type: 'bubble',
    data: {
        datasets: [{
            label: 'Bubbles',
            data: bubbles,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
        }]
    },
    options: {
        scales: {
            x: { display: false },
            y: { display: false }
        },
        plugins: {
            legend: { display: false }
        },
        elements: {
            line: {
                tension: 0.4, // Điều chỉnh độ cong của đường nối
                borderWidth: 1,
                borderColor: 'rgba(255, 99, 132, 0.4)'
            }
        }
    }
});

// Tạo animation loop cho bong bóng
function animateBubbles() {
    for (var i = 0; i < numBubbles; i++) {
        // Cập nhật vị trí của bong bóng
        bubbles[i].x += bubbles[i].speedX;
        bubbles[i].y += bubbles[i].speedY;

        // Kiểm tra xem bong bóng có chạm biên không
        if (bubbles[i].x - bubbles[i].radius < 0 || bubbles[i].x + bubbles[i].radius > canvas.width) {
            // Nếu chạm biên ngang, đảo hướng tốc độ theo chiều ngang
            bubbles[i].speedX = -bubbles[i].speedX;
        }

        if (bubbles[i].y - bubbles[i].radius < 0 || bubbles[i].y + bubbles[i].radius > canvas.height) {
            // Nếu chạm biên dọc, đảo hướng tốc độ theo chiều dọc
            bubbles[i].speedY = -bubbles[i].speedY;
        }
    }

    // Xóa nền của canvas để tạo hiệu ứng vẽ mới
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ các bong bóng
    for (var i = 0; i < numBubbles; i++) {
        ctx.beginPath();
        ctx.arc(bubbles[i].x, bubbles[i].y, bubbles[i].radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 99, 132, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 99, 132, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Gọi lại hàm animation
    requestAnimationFrame(animateBubbles);
}

// Khởi chạy animation
animateBubbles();
