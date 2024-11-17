
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, '../public')));
app.use('/controller', express.static(path.join(__dirname, '../controller')));

// 게임 소켓 연결 관리
const games = new Map();

// 소켓 연결 처리
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 게임 화면 연결
    socket.on('game-connect', () => {
        games.set(socket.id, { id: socket.id });
        console.log('Game connected:', socket.id);
    });

    // 컨트롤러 연결
    socket.on('controller-connect', (gameId) => {
        if (games.has(gameId)) {
            socket.gameId = gameId;
            console.log('Controller connected to game:', gameId);
        }
    });

    // 컨트롤러 입력 처리
    socket.on('control-input', (data) => {
        if (socket.gameId && games.has(socket.gameId)) {
            io.to(socket.gameId).emit('game-control', data);
        }
    });

    // 연결 해제 처리
    socket.on('disconnect', () => {
        if (games.has(socket.id)) {
            games.delete(socket.id);
            console.log('Game disconnected:', socket.id);
        }
        console.log('Client disconnected:', socket.id);
    });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});