const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const info = document.getElementById("info");

const ocrButton = document.getElementById("ocrButton");
const status = document.getElementById("status");
const ocrResult = document.getElementById("ocrResult");

let selectedFile = null;


// ===============================
// CHỌN ẢNH
// ===============================

imageInput.addEventListener("change", function () {

    selectedFile = imageInput.files[0];

    if (!selectedFile) {
        return;
    }

    const imageURL = URL.createObjectURL(selectedFile);

    preview.innerHTML = `
        <img src="${imageURL}" alt="Ảnh đã chọn">
    `;

    info.innerHTML = `
        <p><strong>Tên file:</strong> ${selectedFile.name}</p>
        <p><strong>Kích thước:</strong> ${selectedFile.size} bytes</p>
        <p><strong>Loại file:</strong> ${selectedFile.type}</p>
    `;

    ocrButton.disabled = false;

    status.textContent = "Ảnh đã sẵn sàng.";

    ocrResult.value = "";
});


// ===============================
// TIỀN XỬ LÝ ẢNH
// ===============================

function preprocessImage(file) {

    return new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = function () {

            const scale = 2;

            const canvas = document.createElement("canvas");

            canvas.width = image.width * scale;
            canvas.height = image.height * scale;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );

            const data = imageData.data;

            // Chuyển sang grayscale
            for (let i = 0; i < data.length; i += 4) {

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const gray =
                    0.299 * r +
                    0.587 * g +
                    0.114 * b;

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob(
                blob => {

                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(
                            new Error("Không tạo được ảnh xử lý")
                        );
                    }

                },
                "image/png"
            );
        };

        image.onerror = reject;

        image.src = URL.createObjectURL(file);
    });
}


// ===============================
// LỌC MÃ
// ===============================

function extractCodes(text) {

    const normalized = text
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, " ");

    const words = normalized.split(/\s+/);

    const candidates = [];

    for (const word of words) {

        // Mã có cả chữ và số
        const hasLetter = /[A-Z]/.test(word);
        const hasNumber = /[0-9]/.test(word);

        // Độ dài tối thiểu
        if (
            word.length >= 8 &&
            word.length <= 30 &&
            hasLetter &&
            hasNumber
        ) {

            candidates.push(word);
        }
    }

    return [...new Set(candidates)];
}


// ===============================
// OCR
// ===============================

ocrButton.addEventListener("click", async function () {

    if (!selectedFile) {
        return;
    }

    ocrButton.disabled = true;

    status.textContent =
        "⏳ Đang xử lý ảnh...";

    ocrResult.value = "";

    try {

        const processedImage =
            await preprocessImage(selectedFile);

        status.textContent =
            "🔍 Đang chạy OCR...";

        const result = await Tesseract.recognize(
            processedImage,
            "eng",
            {

                logger: function (message) {

                    if (
                        message.status ===
                        "recognizing text"
                    ) {

                        const percent =
                            Math.round(
                                message.progress * 100
                            );

                        status.textContent =
                            `🔍 OCR: ${percent}%`;
                    }
                },

                tessedit_pageseg_mode: "6"
            }
        );

        const rawText =
            result.data.text;

        const codes =
            extractCodes(rawText);

        let output = "";

        output += "=== VĂN BẢN OCR ===\n\n";
        output += rawText.trim();

        output += "\n\n====================\n\n";

        output += "=== MÃ CÓ KHẢ NĂNG ===\n\n";

        if (codes.length === 0) {

            output +=
                "Chưa phát hiện mã phù hợp.";

        } else {

            codes.forEach((code, index) => {

                output +=
                    `${index + 1}. ${code}\n`;
            });
        }

        ocrResult.value = output;

        status.textContent =
            `✅ Hoàn tất — tìm thấy ${codes.length} mã`;

    } catch (error) {

        console.error(error);

        status.textContent =
            "❌ OCR bị lỗi: " + error.message;
    }

    ocrButton.disabled = false;
});
