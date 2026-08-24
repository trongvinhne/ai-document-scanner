const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const info = document.getElementById("info");

const ocrButton = document.getElementById("ocrButton");
const status = document.getElementById("status");
const ocrResult = document.getElementById("ocrResult");

let selectedFile = null;

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


ocrButton.addEventListener("click", async function () {

    if (!selectedFile) {
        return;
    }

    ocrButton.disabled = true;

    status.textContent = "⏳ Đang đọc ảnh...";

    ocrResult.value = "";

    try {

        const result = await Tesseract.recognize(
            selectedFile,
            "eng",
            {
                logger: function (message) {

                    if (message.status === "recognizing text") {

                        const percent = Math.round(
                            message.progress * 100
                        );

                        status.textContent =
                            `🔍 Đang OCR: ${percent}%`;
                    }
                }
            }
        );

        ocrResult.value = result.data.text;

        status.textContent = "✅ OCR hoàn tất.";

    } catch (error) {

        console.error(error);

        status.textContent =
            "❌ OCR bị lỗi. Hãy thử lại.";

    }

    ocrButton.disabled = false;
});
