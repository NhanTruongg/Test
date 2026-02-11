const mineflayer = require('mineflayer');
const fs = require('fs');

// ──────────────────────────────────────────────
// CẤU HÌNH
// ──────────────────────────────────────────────
const SERVER = {
    host: 'luckyvn.com',
    port: 25565,
    version: '1.20.4'
};

const DEFAULT_PASSWORD = '21042010';
const RECONNECT_DELAY_NORMAL = 7000;      // ms - reconnect thông thường
const RECONNECT_DELAY_ECONNRESET = 3000;  // ms - reconnect nhanh khi ECONNRESET
const START_DELAY_BETWEEN_ACCOUNTS = 8000;
const MENU_OPEN_TIMEOUT = 15000;

// ──────────────────────────────────────────────
// ĐỌC DANH SÁCH TÀI KHOẢN
// ──────────────────────────────────────────────
let accounts = [];
try {
    const data = fs.readFileSync('acc.txt', 'utf8');
    accounts = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

    console.log(`Đọc được ${accounts.length} tài khoản từ acc.txt`);
    if (accounts.length === 0) {
        console.error('❌ File acc.txt rỗng hoặc không hợp lệ!');
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Không đọc được acc.txt:', err.message);
    process.exit(1);
}

// ──────────────────────────────────────────────
// TẠO BOT CHO TỪNG TÀI KHOẢN
// ──────────────────────────────────────────────
function createBot(username) {
    console.log(`\n━━━━━━━━━━━━━━ ${username} ━━━━━━━━━━━━━━`);

    const bot = mineflayer.createBot({
        ...SERVER,
        username
    });

    let isLoggedIn = false;
    let hasWarped = false;
    let hasOpenedMenu = false;
    let menuTimeout = null;

    function resetState() {
        isLoggedIn = false;
        hasWarped = false;
        hasOpenedMenu = false;
        if (menuTimeout) clearTimeout(menuTimeout);
        menuTimeout = null;
    }

    function reconnectWithDelay(delay = RECONNECT_DELAY_NORMAL) {
        console.log(`[${username}] Sẽ reconnect sau ${delay / 1000}s...`);
        setTimeout(() => createBot(username), delay);
    }

    // ─── Khi spawn ───────────────────────────────────────
    bot.once('spawn', () => {
        console.log(`[${username}] Spawn OK`);

        resetState();

        setTimeout(() => {
            if (!isLoggedIn) {
                bot.chat(`/login ${DEFAULT_PASSWORD}`);
                console.log(`[${username}] → /login`);
            }
        }, 3200);

        setTimeout(() => {
            bot.setQuickBarSlot(4);
            bot.activateItem();
            console.log(`[${username}] → Mở menu (slot 4)`);

            menuTimeout = setTimeout(() => {
                if (!hasOpenedMenu) {
                    console.log(`[${username}] KẸT MỞ MENU >15s → reconnect`);
                    bot.end('Kẹt mở menu quá lâu');
                }
            }, MENU_OPEN_TIMEOUT);
        }, 3800);
    });

    // ─── Window mở ───────────────────────────────────────
    bot.on('windowOpen', (window) => {
        console.log(`[${username}] Window mở: \( {window.title} ( \){window.slots.length} slots)`);

        hasOpenedMenu = true;
        if (menuTimeout) {
            clearTimeout(menuTimeout);
            menuTimeout = null;
        }

        if (hasWarped) return;

        setTimeout(() => {
            bot.clickWindow(22, 0, 0);
            console.log(`[${username}] → Click slot 20`);

            setTimeout(() => {
                bot.clickWindow(16, 0, 0);
                console.log(`[${username}] → Click slot 22`);
            }, 400);
        }, 800);
    });

    // ─── Window đóng → warp afk ──────────────────────────
    bot.on('windowClose', () => {
        console.log(`[${username}] Window đóng`);

        setTimeout(() => {
            if (!hasWarped && isLoggedIn) {
                bot.chat('/warp afk');
                console.log(`[${username}] → /warp afk`);
                hasWarped = true;
            }
        }, 1400);
    });

    // ─── Phát hiện login thành công ──────────────────────
    bot.on('message', (jsonMsg) => {
        const msg = jsonMsg.toString().toLowerCase();
        if (msg.includes('đăng nhập thành công') ||
            msg.includes('chào mừng') ||
            msg.includes('welcome') ||
            msg.includes('đã đăng nhập')) {
            if (!isLoggedIn) {
                console.log(`[${username}] → LOGIN THÀNH CÔNG`);
                isLoggedIn = true;
            }
        }
    });

    // ─── Xử lý ngắt kết nối ──────────────────────────────
    bot.on('end', (reason) => {
        const reasonStr = reason ? reason.toString().toLowerCase() : '';
        if (reasonStr.includes('econnreset') || reasonStr.includes('connection reset')) {
            console.log(`[${username}] Lỗi ECONNRESET → reconnect nhanh`);
            reconnectWithDelay(RECONNECT_DELAY_ECONNRESET);
        } else {
            console.log(`[\( {username}] Ngắt kết nối ( \){reason || 'không rõ'}) → reconnect bình thường`);
            reconnectWithDelay(RECONNECT_DELAY_NORMAL);
        }

        if (menuTimeout) clearTimeout(menuTimeout);
        resetState();
    });

    // ─── Xử lý lỗi ───────────────────────────────────────
    bot.on('error', (err) => {
        const errMsg = err.message || err.toString();
        console.log(`[${username}] Lỗi: ${errMsg}`);

        if (errMsg.includes('ECONNRESET') || errMsg.includes('connection reset')) {
            console.log(`[${username}] Phát hiện ECONNRESET trong error → reconnect nhanh`);
            reconnectWithDelay(RECONNECT_DELAY_ECONNRESET);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`[${username}] Bị kick: ${reason}`);
    });
}

// ──────────────────────────────────────────────
// KHỞI ĐỘNG TẤT CẢ BOT
// ──────────────────────────────────────────────
function startBots() {
    console.log(`\nKhởi động ${accounts.length} tài khoản...\n`);

    accounts.forEach((username, index) => {
        setTimeout(() => {
            createBot(username);
        }, index * START_DELAY_BETWEEN_ACCOUNTS);
    });
}

// Chạy lần đầu (và chỉ chạy một lần, không restart tự động nữa)
startBots();

// Giữ process sống
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
