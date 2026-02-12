const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory')
function createBot() {
    console.log('🔄 Đang khởi động bot... (không dùng proxy)');

    const bot = mineflayer.createBot({
        host: 'kingmc.vn',
        port: 25565,
        username: 'nhanvn3',
        version: '1.20.4',
        skipValidation: true,       // giữ nguyên để hỗ trợ offline/cracked nếu cần
        connectTimeout: 30000
    });
    inventoryViewer(bot)
    let isLoggedIn = false;
    let hasWarped = false;

    // ─── Khi bot spawn ───────────────────────────────────────
    bot.once('spawn', () => {
        console.log('✅ Bot đã spawn (kết nối trực tiếp)');
        console.log('IP hiện tại (nếu server hiển thị): kiểm tra chat hoặc log server nếu có');

        hasWarped = false;
        isLoggedIn = false;

        setTimeout(() => {
            if (!isLoggedIn) {
                bot.chat('/dn 21042010');
                console.log('🔑 Đã gửi lệnh đăng nhập: /dn 21042010');
            }
        }, 1500);

        setTimeout(() => {
            bot.setQuickBarSlot(4);
            bot.activateItem();
            console.log('📦 Đã mở menu (click slot 4 hotbar)');
        }, 4000);
    });

    // ─── Khi menu mở ───────────────────────────────
    bot.on('windowOpen', (window) => {
        console.log(`📦 Window mở: "${window.title}" (slots: ${window.slots.length})`);

        if (hasWarped) return;

        setTimeout(() => {
            const slot = 24;

            const item = window.slots[slot];
            console.log(`🖱️ Slot ${slot} → ${item.name} (type: ${item.type})`);

            bot.clickWindow(slot, 0, 0);
            console.log(`✅ Đã click slot ${slot}`);
        }, 800);
    });

    // ─── Khi window đóng → warp ───────
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

    // ─── Auto jump chống AFK ─────────────────────────────
    setInterval(() => {
        if (bot.entity?.position) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 180);
        }
    }, 5000);

    // ─── Detect login success ───────
    bot.on('message', (jsonMsg) => {
        const msg = jsonMsg.toString().toLowerCase();
        if (msg.includes('đăng nhập thành công') || msg.includes('chào mừng') || msg.includes('welcome')) {
            if (!isLoggedIn) {
                console.log('🎉 Đăng nhập thành công!');
                isLoggedIn = true;
            }
        }
    });

    // ─── Xử lý disconnect / kick ─────────────────
    bot.on('end', (reason) => {
        console.log(`❌ Bot ngắt kết nối (lý do: ${reason || 'không rõ'}) → reconnect sau 8 giây...`);
        isLoggedIn = false;
        hasWarped = false;
        setTimeout(createBot, 8000);
    });

    bot.on('error', (err) => {
        console.log('⚠️ Lỗi bot:', err.message || err);
        if (err.message?.includes('socket') || err.message?.includes('closed') || err.message?.includes('timeout')) {
            console.log('→ Lỗi kết nối, thử lại sau...');
        }
    });

    bot.on('kicked', (reasonObj) => {
        const reason = JSON.stringify(reasonObj);
        console.log(`👢 Bị kick: ${reason}`);

        if (reason.includes('cấm VPN') || reason.includes('Proxy') || reason.includes('VPN/Proxy')) {
            console.log('→ Server detect proxy/VPN (dù đã bỏ proxy → có thể IP nhà bạn bị ghi nhận trước đó)');
        }
    });
}

// Khởi động
createBot();
