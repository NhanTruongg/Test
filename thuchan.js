const mineflayer = require('mineflayer');

function createBot() {
    console.log('🔄 Đang khởi động bot... (không dùng proxy)');

    const bot = mineflayer.createBot({
        host: 'kingmc.vn',
        port: 25565,
        username: '',
        version: '1.20.4',
        skipValidation: true,
        connectTimeout: 30000
    });
    
    let isLoggedIn = false;
    let hasWarped = false;
    let menuTimeout = null;           // timer kiểm tra kẹt menu
    const MENU_TIMEOUT_MS = 22000;    // 22 giây (cho dư một chút)

    // Reset trạng thái khi reconnect
    function resetStates() {
        isLoggedIn = false;
        hasWarped = false;
        if (menuTimeout) {
            clearTimeout(menuTimeout);
            menuTimeout = null;
        }
    }

    bot.once('spawn', () => {
        console.log('✅ Bot đã spawn');
        resetStates();

        // Đăng nhập
        setTimeout(() => {
            if (!isLoggedIn) {
                bot.chat('/dn ');
                console.log('🔑 Đã gửi /dn');
            }
        }, 1500);

        // Thử mở menu
        setTimeout(() => {
            if (!hasWarped) {
                bot.setQuickBarSlot(4);
                bot.activateItem();
                console.log('📦 Đã thử mở menu (slot 4)');

                // Bắt đầu đếm thời gian chờ windowOpen
                menuTimeout = setTimeout(() => {
                    if (!hasWarped) {
                        console.log('⚠️ Kẹt mở menu quá 22 giây → tự disconnect để reconnect');
                        bot.end('menu timeout');  // lý do tùy ý, chỉ để log
                    }
                }, MENU_TIMEOUT_MS);
            }
        }, 4000);
    });

    // Khi menu thực sự mở → hủy timer timeout
    bot.on('windowOpen', (window) => {
        console.log(`📦 Window mở: "${window.title}" (slots: ${window.slots.length})`);

        // Hủy timer nếu đang chạy
        if (menuTimeout) {
            clearTimeout(menuTimeout);
            menuTimeout = null;
        }

        if (hasWarped) return;

        setTimeout(() => {
            const slot = 24;
            const item = window.slots[slot];
            console.log(`🖱️ Slot ${slot} → ${item?.name || 'không có item'} (type: ${item?.type || '?'})`);

            bot.clickWindow(slot, 0, 0);
            console.log(`✅ Đã click slot ${slot}`);
        }, 800);
    });

    // Khi window đóng → warp
    bot.on('windowClose', () => {
        console.log(`🗑️ Window đã đóng`);

        setTimeout(() => {
            if (!hasWarped && isLoggedIn) {
                bot.chat('/warp afk1');
                console.log('🚀 Đã gửi /warp afk1');
                hasWarped = true;
            }
        }, 1200);
    });

    // Phát hiện đăng nhập thành công
    bot.on('message', (jsonMsg) => {
        const msg = jsonMsg.toString().toLowerCase();
        if (msg.includes('đăng nhập thành công') || 
            msg.includes('chào mừng') || 
            msg.includes('welcome')) {
            if (!isLoggedIn) {
                console.log('🎉 Đăng nhập thành công!');
                isLoggedIn = true;
            }
        }
    });

    // Auto jump chống AFK
    setInterval(() => {
        if (bot.entity?.position && isLoggedIn) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 180);
        }
    }, 5000);

    // ─── Xử lý ngắt kết nối ────────────────────────────────
    bot.on('end', (reason) => {
        console.log(`❌ Bot ngắt kết nối (lý do: ${reason || 'không rõ'}) → reconnect sau 8s...`);
        resetStates();
        setTimeout(createBot, 8000);
    });

    bot.on('error', (err) => {
        console.log('⚠️ Lỗi:', err.message || err);
        // Không reconnect ngay ở đây → để 'end' xử lý
    });

    bot.on('kicked', (reasonObj) => {
        const reason = JSON.stringify(reasonObj);
        console.log(`👢 Bị kick: ${reason}`);
        // 'end' sẽ được gọi sau kicked → reconnect tự động
    });
}

// Khởi động lần đầu
createBot();
