// face-script.js

const video = document.getElementById('myvideo');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

const labels = ['鈴木', '山本'];

// 出勤状態 (true = 出勤, false = 退勤)
const attendance = new Map();
labels.forEach(label => attendance.set(label, false)); // 初期化

let prevDetected = new Set();
const lastToggleTimes = new Map();
const TOGGLE_COOLDOWN = 50000; // ミリ秒（例：50秒）

const statusSpan = document.getElementById('status');

//  顔認識用モデル読み込み
async function loadModels() {
    const MODEL_URL = './models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

function updateAttendanceList() {
    const listElement = document.getElementById('attendance-list');
    listElement.innerHTML = '';

    attendance.forEach((isIn, username) => {
        const li = document.createElement('li');
        li.textContent = `${username} - ${isIn ? '出勤' : '退勤'}`;
        listElement.appendChild(li);
    });
}

//  punch_type を取得して attendance Map を初期化
async function initializeAttendance() {
    for (const label of labels) {
        try {
            const response = await fetch(`/api/latest-punch?username=${label}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success && data.data && data.data.punch_type) {
                attendance.set(label, data.data.punch_type === 'IN');
                console.log(`初期化: ${label} → ${data.data.punch_type}`);
            } else {
                attendance.set(label, false); // デフォルト OUT
                console.log(`初期化: ${label} → OUT (default)`);
            }
        } catch (err) {
            console.error(`初期化エラー: ${label}`, err);
            attendance.set(label, false); // fallback
        }
    }
}

// ラベル画像（教師データ）読み込み
async function loadLabeledDescriptors() {
    const labeledDescriptors = [];

    for (const label of labels) {
        const img = await faceapi.fetchImage(`labeled-images/${label}.jpg`);
        const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            console.warn(`No face detected in labeled image for ${label}`);
            continue;
        }

        const descriptors = [detection.descriptor];
        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptors));
    }

    return labeledDescriptors;
}

// メイン開始
async function start() {
    await loadModels();
    await initializeAttendance();
    updateAttendanceList();

    const labeledDescriptors = await loadLabeledDescriptors();
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => console.error('カメラ起動エラー:', err));

    video.addEventListener('play', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resized = faceapi.resizeResults(detections, displaySize);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const currentDetected = new Set();
            resized.forEach(detection => {
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                const label = bestMatch.label;
                currentDetected.add(label);

                const box = detection.detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
                drawBox.draw(canvas);
            });

            const now = Date.now();

            for (const label of currentDetected) {
                const wasDetected = prevDetected.has(label);
                const lastToggle = lastToggleTimes.get(label) || 0;

                if (!wasDetected && now - lastToggle > TOGGLE_COOLDOWN) {
                    const newState = !attendance.get(label);
                    attendance.set(label, newState);
                    lastToggleTimes.set(label, now);

                    // ステータス表示を更新
                    statusSpan.textContent = newState ? '出勤' : '退勤';

                    // punch 送信
                    fetch('/api/punch', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: label,
                            punch_type: newState ? 'IN' : 'OUT'
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                console.log(`打刻成功: ${label} → ${newState ? '出勤' : '退勤'}`);
                                updateAttendanceList();
                            } else {
                                console.error('打刻エラー:', data.error);
                            }
                        })
                        .catch(error => {
                            console.error('打刻通信エラー:', error);
                        });
                }
            }

            prevDetected = currentDetected;
        }, 200);
    });
}

window.addEventListener('DOMContentLoaded', start);
