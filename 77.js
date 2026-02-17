const mineflayer = require('mineflayer');

function createBot() {
    console.log('🔄 Đang kết nối đến server...');

    const bot = mineflayer.createBot({
        host: 'kingmc.vn',
        port: 25565,
        username: 'nhanvn5',
        version: '1.18.2',
        // --- CẤU HÌNH CHỐNG SOCKET CLOSED ---
        checkTimeoutInterval: 45000, 
        keepAlive: true,
        hideErrors: true,
        connectTimeout: 30000
    });

    let isLoggedIn = false;
    let step = 0; // 1: Chờ menu Warp, 2: Chờ menu AFK
    let retryInterval = null;

    // Hàm dọn dẹp vòng lặp click
    const clearRetry = () => {
        if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
        }
    };

    // Hàm gửi chat an toàn (tránh crash khi socket đã đóng)
    const safeChat = (msg) => {
        if (bot && bot.entity && bot.player) {
            bot.chat(msg);
        }
    };

    bot.once('spawn', () => {
        console.log('✅ Bot đã vào server!');
        clearRetry();
        
        // Đăng nhập sau 2s
        setTimeout(() => {
            safeChat('/dn 21042010');
            console.log('🔑 Đã gửi lệnh login');
        }, 2000);
    });

    bot.on('messagestr', (msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('thành công') || lowerMsg.includes('welcome') || lowerMsg.includes('chào mừng')) {
            if (!isLoggedIn) {
                isLoggedIn = true;
                console.log('🎉 Đăng nhập thành công!');
                
                // Sau 3s bắt đầu quy trình mở menu
                setTimeout(() => {
                    step = 1;
                    bot.setQuickBarSlot(4);
                    bot.activateItem(); 
                    console.log('📦 Đang mở Menu Warp...');
                    
                    // Cơ chế click nhắc lại mỗi 3s nếu menu vẫn mở
                    clearRetry();
                    retryInterval = setInterval(() => {
                        if (bot.currentWindow) {
                            if (step === 1) {
                                console.log('🖱️ Click nhắc lại Slot 24...');
                                bot.clickWindow(24, 0, 0);
                            } else if (step === 2) {
                                console.log('🖱️ Click nhắc lại Slot 4...');
                                bot.clickWindow(4, 0, 0);
                            }
                        } else {
                            // Nếu menu chưa mở, thử bấm Slot 4/gõ lệnh lại
                            if (step === 1) bot.activateItem();
                            if (step === 2) safeChat('/afk');
                        }
                    }, 3500);
                }, 3000);
            }
        }
    });

    bot.on('windowOpen', (window) => {
        console.log(`📦 Menu mở (Slots: ${window.slots.length})`);
        // Đợi 1s cho item kịp load rồi click ngay phát đầu
        setTimeout(() => {
            if (step === 1) bot.clickWindow(24, 0, 0);
            if (step === 2) bot.clickWindow(4, 0, 0);
        }, 1000);
    });

    bot.on('windowClose', () => {
        if (step === 1) {
            console.log('✅ Đã click Warp, chuẩn bị gõ /afk...');
            step = 0; // Tạm nghỉ
            setTimeout(() => {
                step = 2;
                safeChat('/afk');
                console.log('💬 Đã gửi /afk');
            }, 3000);
        } else if (step === 2) {
            console.log('🚀 Đã vào khu AFK thành công!');
            step = 3;
            clearRetry(); // Hoàn tất quy trình thì ngừng click nhắc lại
        }
    });

    // --- XỬ LÝ LỖI VÀ RECONNECT ---
    bot.on('error', (err) => {
        console.log(`⚠️ Lỗi Socket: ${err.code || err.message}`);
    });

    bot.on('end', (reason) => {
        console.log(`🔌 Kết nối bị ngắt (${reason}). Reconnect sau 10s...`);
        clearRetry();
        isLoggedIn = false;
        step = 0;
        // Xóa hết listener để tránh tràn bộ nhớ
        bot.removeAllListeners();
        setTimeout(createBot, 10000);
    });

    // Anti-AFK Nhảy (mỗi 15s)
    setInterval(() => {
        if (isLoggedIn && bot.entity) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 200);
        }
    }, 15000);
}

// Chạy bot
try {
    createBot();
} catch (e) {
    console.error('Lỗi khởi động:', e);
}
