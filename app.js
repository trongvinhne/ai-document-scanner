const imageInput = document.getElementById("imageInput");
const imageArea = document.getElementById("imageArea");
const sourceImage = document.getElementById("sourceImage");
const selectionBox = document.getElementById("selectionBox");
const selectionInfo = document.getElementById("selectionInfo");
const ocrButton = document.getElementById("ocrButton");
const status = document.getElementById("status");
const ocrResult = document.getElementById("ocrResult");

let selectedFile = null;
let imageDataURL = null;

let selecting = false;
let startX = 0;
let startY = 0;
let selection = null;


// ================================
// CHỌN ẢNH
// ================================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    selectedFile = file;

    status.textContent = "⏳ Đang tải ảnh...";

    const reader = new FileReader();

    reader.onload = function (event) {

        imageDataURL = event.target.result;

        sourceImage.onload = function () {

            imageArea.style.display = "block";

            selection = null;

            selectionBox.style.display = "none";

            ocrButton.disabled = true;

            selectionInfo.textContent =
                "👉 Kéo ngón tay quanh mã cần đọc.";

            status.textContent =
                "✅ Ảnh đã sẵn sàng.";

            ocrResult.value = "";
        };

        sourceImage.onerror = function () {

            status.textContent =
                "❌ Không thể hiển thị ảnh.";
        };

        sourceImage.src = imageDataURL;
    };

    reader.onerror = function () {

        status.textContent =
            "❌ Không thể đọc file ảnh.";
    };

    reader.readAsDataURL(file);
});


// ================================
// LẤY VỊ TRÍ NGÓN TAY
// ================================

function getTouchPosition(event) {

    const rect =
        imageArea.getBoundingClientRect();

    const touch =
        event.touches[0];

    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}


// ================================
// BẮT ĐẦU KHOANH
// ================================

imageArea.addEventListener(
    "touchstart",
    function (event) {

        if (!selectedFile || !sourceImage.complete) {
            return;
        }

        event.preventDefault();

        const pos =
            getTouchPosition(event);

        startX = pos.x;
        startY = pos.y;

        selecting = true;

        selection = {
            x: startX,
            y: startY,
            width: 0,
            height: 0
        };

        selectionBox.style.display = "block";

        selectionBox.style.left =
            startX + "px";

        selectionBox.style.top =
            startY + "px";

        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
    },
    { passive: false }
);


// ================================
// KÉO KHUNG
// ================================

imageArea.addEventListener(
    "touchmove",
    function (event) {

        if (!selecting) {
            return;
        }

        event.preventDefault();

        const pos =
            getTouchPosition(event);

        const x =
            Math.min(startX, pos.x);

        const y =
            Math.min(startY, pos.y);

        const width =
            Math.abs(pos.x - startX);

        const height =
            Math.abs(pos.y - startY);

        selection = {
            x,
            y,
            width,
            height
        };

        selectionBox.style.left =
            x + "px";

        selectionBox.style.top =
            y + "px";

        selectionBox.style.width =
            width + "px";

        selectionBox.style.height =
            height + "px";
    },
    { passive: false }
);


// ================================
// KẾT THÚC KHOANH
// ================================

imageArea.addEventListener(
    "touchend",
    function () {

        if (!selecting) {
            return;
        }

        selecting = false;

        if (
            selection &&
            selection.width >= 20 &&
            selection.height >= 10
        ) {

            ocrButton.disabled = false;

            selectionInfo.textContent =
                "✅ Đã chọn vùng — bấm Đọc vùng đã chọn.";

        } else {

            selection = null;

            ocrButton.disabled = true;

            selectionInfo.textContent =
                "⚠️ Vùng quá nhỏ. Hãy khoanh lại.";
        }
    }
);


// ================================
// TẠO VÙNG CẮT
// ================================

function createCropCanvas() {

    const rect =
        sourceImage.getBoundingClientRect();

    const scaleX =
        sourceImage.naturalWidth / rect.width;

    const scaleY =
        sourceImage.naturalHeight / rect.height;

    const sourceX =
        selection.x * scaleX;

    const sourceY =
        selection.y * scaleY;

    const sourceWidth =
        selection.width * scaleX;

    const sourceHeight =
        selection.height * scaleY;

    const enlarge = 4;

    const canvas =
        document.createElement("canvas");

    canvas.width =
        Math.round(sourceWidth * enlarge);

    canvas.height =
        Math.round(sourceHeight * enlarge);

    const ctx =
        canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;

    ctx.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return canvas;
}


// ================================
// OCR
// ================================

ocrButton.addEventListener(
    "click",
    async function () {

        if (!selection) {
            return;
        }

        ocrButton.disabled = true;

        status.textContent =
            "⏳ Đang chuẩn bị OCR...";

        ocrResult.value = "";

        try {

            const cropCanvas =
                createCropCanvas();

            status.textContent =
                "🔍 Đang đọc vùng đã chọn...";

            const result =
                await Tesseract.recognize(
                    cropCanvas,
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

                        tessedit_pageseg_mode: 7
                    }
                );

            const text =
                result.data.text.trim();

            ocrResult.value =
                text || "Không nhận dạng được.";

            status.textContent =
                "✅ OCR hoàn tất.";

        } catch (error) {

            console.error(error);

            status.textContent =
                "❌ OCR lỗi: " +
                error.message;
        }

        ocrButton.disabled = false;
    }
);
