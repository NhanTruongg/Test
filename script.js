document.addEventListener('DOMContentLoaded', () => {
    const createGifBtn = document.getElementById('createGifBtn');
    const container = document.getElementById('container');
    const envelopeClosed = document.getElementById('envelope-closed');
    const envelopeOpen = document.getElementById('envelope-open');
    const gifContainer = document.getElementById('gifContainer');

    createGifBtn.addEventListener('click', async () => {
        // 1. Khởi tạo GIF encoder
        const gif = new GIF({
            workers: 2, // Số lượng worker để xử lý ảnh, có thể điều chỉnh
            quality: 10, // Chất lượng GIF (1-100, 1 là tốt nhất)
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        // 2. Chụp Frame 1 (Phong bì đóng)
        envelopeClosed.classList.remove('hidden');
        envelopeOpen.classList.add('hidden');
        await new Promise(resolve => setTimeout(resolve, 100)); // Đợi DOM render
        const canvasFrame1 = await html2canvas(container, {
            backgroundColor: null, // Để nền trong suốt nếu không có nền cho container
            useCORS: true,
        });
        gif.addFrame(canvasFrame1.getContext('2d'), { delay: 2000 }); // Hiển thị 2 giây

        // 3. Chụp Frame 2 (Phong bì mở)
        envelopeClosed.classList.add('hidden');
        envelopeOpen.classList.remove('hidden');
        await new Promise(resolve => setTimeout(resolve, 100)); // Đợi DOM render
        const canvasFrame2 = await html2canvas(container, {
            backgroundColor: null,
            useCORS: true,
        });
        gif.addFrame(canvasFrame2.getContext('2d'), { delay: 3000 }); // Hiển thị 3 giây

        // 4. Bắt đầu render GIF
        gif.on('finished', (blob) => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            gifContainer.innerHTML = ''; // Xóa ảnh cũ nếu có
            gifContainer.appendChild(img);

            // Tự động tải xuống
            const a = document.createElement('a');
            a.href = img.src;
            a.download = 'thiep-20-11.gif';
            a.textContent = 'Tải GIF về máy';
            a.style.display = 'block';
            a.style.marginTop = '10px';
            gifContainer.appendChild(a);

            // Hoặc bạn có thể tự động kích hoạt tải xuống luôn:
            // const downloadLink = document.createElement('a');
            // downloadLink.href = img.src;
            // downloadLink.download = 'thiep-20-11.gif';
            // downloadLink.click();
            // URL.revokeObjectURL(img.src); // Giải phóng bộ nhớ
        });

        gif.render();
    });
});
