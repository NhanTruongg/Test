const mineflayer = require('mineflayer');

function createBot() {
    console.log('🔄 Đang khởi động bot...');

    const bot = mineflayer.createBot({
        host: 'kingmc.vn',
        port: 25565,
        username: 'nhanvn5',
        version: '1.20.4',
        skipValidation: true,
        connectTimeout: 30000
    });


    let isLoggedIn = false;
    let step = 0; // 0: Idle, 1: Chờ menu Warp, 2: Chờ menu AFK
    let menuWatcher = null; // Bộ hẹn giờ theo dõi menu

    function resetStates() {
        isLoggedIn = false;
        step = 0;
        clearMenuWatcher();
    }

    function clearMenuWatcher() {
        if (menuWatcher) {
            clearTimeout(menuWatcher);
            menuWatcher = null;
        }
    }

    function startMenuWatcher(reason) {
        clearMenuWatcher();
        menuWatcher = setTimeout(() => {
            console.log(`⚠️ Quá 15s không thấy menu (${reason}) -> Reconnect...`);
            bot.end('menu_timeout');
        }, 15000);
    }

    bot.once('spawn', () => {
        console.log('✅ Bot đã spawn thành công!');
        resetStates();

        setTimeout(() => {
            bot.chat('/dn 21042010');
            console.log('🔑 Đã gửi lệnh /dn');
        }, 1500);
    });

    bot.on('messagestr', (msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('thành công') || lowerMsg.includes('welcome') || lowerMsg.includes('chào mừng')) {
            if (!isLoggedIn) {
                isLoggedIn = true;
                console.log('🎉 Đăng nhập thành công!');
                
                setTimeout(() => {
                    bot.setQuickBarSlot(4);
                    bot.activateItem();
                    step = 1; 
                    console.log('📦 Đang mở Menu chính...');
                    startMenuWatcher('Mở Menu Warp'); // Bắt đầu đếm 15s
                }, 2000);
            }
        }
    });

    bot.on('windowOpen', (window) => {
        // Hủy bỏ đếm ngược 15s vì menu đã mở thành công
        clearMenuWatcher();
        console.log(`📦 Menu mở (Số ô: ${window.slots.length})`);

        setTimeout(() => {
            if (step === 1) {
                console.log('🖱️ Click Slot 24 (Warp)...');
                bot.clickWindow(24, 0, 0);
                step = 0; 

                setTimeout(() => {
                    console.log('💬 Gửi lệnh /afk');
                    bot.chat('/afk');
                    step = 2; 
                    startMenuWatcher('Mở Menu AFK'); // Bắt đầu đếm 15s cho menu tiếp theo
                }, 3000);
            } 
            else if (step === 2) {
                console.log('🖱️ Click Slot 4 (Khu AFK)...');
                bot.clickWindow(4, 0, 0);
                step = 3; 
                console.log('✅ Đã vào khu AFK thành công!');
                clearMenuWatcher(); // Đã xong toàn bộ quy trình
            }
        }, 1200);
    });

    // Chống treo máy
    setInterval(() => {
        if (isLoggedIn) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 150);
        }
    }, 10000);

    bot.on('end', (reason) => {
        console.log(`❌ Mất kết nối [${reason}] -> Reconnect sau 8s...`);
        resetStates();
        setTimeout(createBot, 8000);
    });

    bot.on('error', (err) => console.log('⚠️ Lỗi:', err.message));
}

createBot();
