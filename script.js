const canvas = document.getElementById('network-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let routers = [];
let connections = [];

// Tambahkan router ke canvas
document.getElementById('add-router').addEventListener('click', () => {
    const ipAddress = prompt("Masukkan IP Address untuk Router (contoh: 192.168.1.1):");
    if (!ipAddress || !validateIP(ipAddress)) {
        alert("IP Address tidak valid! Format: xxx.xxx.xxx.xxx");
        return;
    }

    const x = Math.random() * (canvas.width - 100) + 50;
    const y = Math.random() * (canvas.height - 100) + 50;
    const id = routers.length + 1;

    routers.push({ id, x, y, ip: ipAddress });
    log(`Router ${id} dengan IP ${ipAddress} ditambahkan.`);
    drawNetwork();
});

// Validasi IP Address
function validateIP(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}


// Gambar topologi jaringan
function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar koneksi
    connections.forEach(({ from, to }) => {
        const fromRouter = routers.find(router => router.id === from);
        const toRouter = routers.find(router => router.id === to);

        ctx.beginPath();
        ctx.moveTo(fromRouter.x, fromRouter.y);
        ctx.lineTo(toRouter.x, toRouter.y);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Gambar router
    routers.forEach(router => {
        // Lingkaran router
        ctx.beginPath();
        ctx.arc(router.x, router.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'green';
        ctx.fill();

        // Nomor router
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(router.id, router.x, router.y);

        // Tampilkan IP Address di bawah router
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(router.ip, router.x, router.y + 30);
    });
}

document.getElementById('simulate-routing').addEventListener('click', () => {
    const sourceIP = prompt("Masukkan IP Address sumber:");
    const targetIP = prompt("Masukkan IP Address tujuan:");

    const sourceRouter = routers.find(router => router.ip === sourceIP);
    const targetRouter = routers.find(router => router.ip === targetIP);

    if (!sourceRouter || !targetRouter) {
        alert("IP Address sumber atau tujuan tidak ditemukan!");
        return;
    }

    log(`Memulai simulasi routing dari IP ${sourceIP} ke IP ${targetIP}.`);
    simulatePacket(sourceRouter.id, targetRouter.id);
});


// Tambahkan koneksi antar router
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedRouter = routers.find(router => {
        const dx = x - router.x;
        const dy = y - router.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedRouter) {
        if (!window.selectedRouter) {
            window.selectedRouter = clickedRouter;
            alert(`Router ${clickedRouter.id} dipilih, klik router lain untuk membuat koneksi.`);
        } else {
            if (window.selectedRouter.id !== clickedRouter.id) {
                connections.push({ from: window.selectedRouter.id, to: clickedRouter.id });
                window.selectedRouter = null;
                drawNetwork();
            } else {
                alert("Tidak dapat membuat koneksi ke router yang sama.");
            }
        }
    }
});

// Simulasikan routing
// document.getElementById('simulate-routing').addEventListener('click', () => {
//     if (routers.length < 2) {
//         alert('Tambahkan minimal dua router untuk simulasi.');
//         return;
//     }

//     // Contoh simulasi routing
//     alert('Routing simulasi: Proses dimulai...');
// });

function dijkstra(sourceId, targetId) {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const queue = [];

    // Inisialisasi jarak
    routers.forEach(router => {
        distances[router.id] = Infinity;
        previous[router.id] = null;
    });
    distances[sourceId] = 0;
    queue.push({ id: sourceId, distance: 0 });

    while (queue.length > 0) {
        // Ambil router dengan jarak terpendek
        queue.sort((a, b) => a.distance - b.distance);
        const current = queue.shift();

        if (visited.has(current.id)) continue;
        visited.add(current.id);

        // Jika mencapai tujuan
        if (current.id === targetId) break;

        // Periksa semua koneksi
        connections.forEach(({ from, to }) => {
            if (from === current.id || to === current.id) {
                const neighborId = from === current.id ? to : from;
                if (!visited.has(neighborId)) {
                    const newDistance = distances[current.id] + 1;
                    if (newDistance < distances[neighborId]) {
                        distances[neighborId] = newDistance;
                        previous[neighborId] = current.id;
                        queue.push({ id: neighborId, distance: newDistance });
                    }
                }
            }
        });
    }

    // Rekonstruksi jalur
    const path = [];
    let step = targetId;
    while (step) {
        path.unshift(step);
        step = previous[step];
    }
    return path.length > 1 ? path : null;
}


function simulatePacket(sourceId, targetId) {
    const path = dijkstra(sourceId, targetId);

    if (!path) {
        log(`Routing gagal: Tidak ada jalur dari Router ${sourceId} ke Router ${targetId}.`);
        return;
    }

    log(`Routing ditemukan: Jalur ${path.join(' → ')}.`);
    let step = 0;

    const interval = setInterval(() => {
        if (step < path.length - 1) {
            drawNetwork();
            const fromRouter = routers.find(r => r.id === path[step]);
            const toRouter = routers.find(r => r.id === path[step + 1]);

            // Animasi paket sebagai titik merah
            const progress = step / (path.length - 1);
            const x = fromRouter.x + progress * (toRouter.x - fromRouter.x);
            const y = fromRouter.y + progress * (toRouter.y - fromRouter.y);

            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();

            step++;
        } else {
            clearInterval(interval);
            log(`Paket berhasil dikirim ke Router ${targetId}.`);
        }
    }, 500);
}



let routingSource = null;

canvas.addEventListener('dblclick', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedRouter = routers.find(router => {
        const dx = x - router.x;
        const dy = y - router.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedRouter) {
        if (!routingSource) {
            routingSource = clickedRouter.id;
            alert(`Router sumber dipilih: ${clickedRouter.id}. Pilih router tujuan.`);
        } else {
            const routingTarget = clickedRouter.id;
            simulatePacket(routingSource, routingTarget);
            routingSource = null;
        }
    }
});

function log(message) {
    const logOutput = document.getElementById('log-output');
    const timestamp = new Date().toLocaleTimeString();
    logOutput.innerHTML += `<p>[${timestamp}] ${message}</p>`;
    logOutput.scrollTop = logOutput.scrollHeight;
}

let isDragging = false;
let draggedRouter = null;

// Event saat mouse ditekan (mulai drag)
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Cari router yang diklik
    draggedRouter = routers.find(router => {
        const dx = mouseX - router.x;
        const dy = mouseY - router.y;
        return Math.sqrt(dx * dx + dy * dy) <= 20; // Radius 20px
    });

    if (draggedRouter) {
        isDragging = true;
    }
});

// Event saat mouse bergerak (proses drag)
canvas.addEventListener('mousemove', (event) => {
    if (isDragging && draggedRouter) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Update posisi router
        draggedRouter.x = mouseX;
        draggedRouter.y = mouseY;

        // Redraw jaringan
        drawNetwork();
    }
});

// Event saat mouse dilepas (akhir drag)
canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        draggedRouter = null;
    }
});

