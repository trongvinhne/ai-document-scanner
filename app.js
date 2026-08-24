const imageInput = document.getElementById("imageInput");
const imageArea = document.getElementById("imageArea");
const sourceImage = document.getElementById("sourceImage");
const selectionBox = document.getElementById("selectionBox");

const selectionInfo =
    document.getElementById("selectionInfo");

const ocrButton =
    document.getElementById("ocrButton");

const status =
    document.getElementById("status");

const ocrResult =
    document.getElementById("ocrResult");


let selectedFile = null;

let startX = 0;
let startY = 0;

let selection = null;

let selecting = false;


// ========================================
// CHỌN ẢNH
// ========================================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    selectedFile = file;

    const url =
        URL.createObjectURL(file);

    sourceImage.onload = function () {

        selection = null;

        selectionBox.style.display = "none";

        ocrButton.disabled = true;

        selectionInfo.textContent =
            "👉 Kéo ngón tay quanh mã cần đọc.";

        status.textContent = "";

        ocrResult.value = "";

        imageArea.style.display = "block";
    };

    sourceImage.src = url;
});


// ========================================
// TỌA ĐỘ NGÓN TAY
// ========================================

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


// ========================================
// BẮT ĐẦU KHOANH
// ========================================

imageArea.addEventListener(
    "touchstart",
    function (event) {

        if (!selectedFile) {
            return;
        }

        event.preventDefault();

        const pos =
            getTouchPosition(event);

        startX = pos.x;
        startY = pos.y;

        selecting = true;

        selectionBox.style.display =
            "block";

        selectionBox.style.left =
            startX + "px";

        selectionBox.style.top =
            startY + "px";

        selectionBox.style.width =
            "0px";

        selectionBox.style.height =
            "0px";
    },
    { passive: false }
);


// ========================================
// KÉO KHUNG
// ========================================

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


// ========================================
// KẾT THÚC KHOANH
// ========================================

imageArea.addEventListener(
    "touchend",
    function () {

        if (!selecting) {
            return;
        }

        selecting = false;

        if (
            selection &&
            selection.width > 15 &&
            selection.height > 10
        ) {

            ocrButton.disabled = false;

            selectionInfo.textContent =
                `Đã chọn: ${
                    Math.round(selection.width)
                } × ${
                    Math.round(selection.height)
                } px`;

        } else {

            selection = null;

            ocrButton.disabled = true;

            selectionInfo.textContent =
                "Vùng quá nhỏ. Hãy khoanh lại.";
        }
    }
);


// ========================================
// TẠO ẢNH CẮT
// ========================================

function createCropCanvas() {

    const imageRect =
        sourceImage.getBoundingClientRect();

    const naturalWidth =
        sourceImage.naturalWidth;

    const naturalHeight =
        sourceImage.naturalHeight;

    const displayWidth =
        imageRect.width;

    const scale =
        naturalWidth / displayWidth;

    const sourceX =
        selection.x * scale;

    const sourceY =
        selection.y * scale;

    const sourceWidth =
        selection.width * scale;

    const sourceHeight =
        selection.height * scale;


    // Phóng to 3 lần
    const enlarge = 3;

    const canvas =
        document.createElement("canvas");

    canvas.width =
        Math.max(
            1,
            Math.round(sourceWidth * enlarge)
        );

    canvas.height =
        Math.max(
            1,
            Math.round(sourceHeight * enlarge)
        );

    const ctx =
        canvas.getContext("2d");


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


// ========================================
// LÀM SẠCH KẾT QUẢ MÃ
// ========================================

function cleanCode(text) {

    let value =
        text
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");


    // Một số lỗi OCR phổ biến
    value =
        value
        .replace(/^VTPI/, "VTPI")
        .replace(/^VTPI/, "VTP1");


    return value;
}


// ========================================
// OCR
// ========================================

ocrButton.addEventListener(
    "click",
    async function () {

        if (!selection || !selectedFile) {
            return;
        }

        ocrButton.disabled = true;

        status.textContent =
            "⏳ Đang chuẩn bị vùng OCR...";

        ocrResult.value = "";


        try {

            const cropCanvas =
                createCropCanvas();


            status.textContent =
                "🔍 Đang OCR...";


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
                                        message.progress *
                                        100
                                    );

                                status.textContent =
                                    `🔍 OCR: ${percent}%`;
                            }
                        },

                        tessedit_pageseg_mode: 7
                    }
                );


            const rawText =
                result.data.text.trim();


            const cleaned =
                cleanCode(rawText);


            ocrResult.value =
                `Kết quả OCR:\n${rawText}\n\n` +
                `Mã đã làm sạch:\n${cleaned}`;


            status.textContent =
                "✅ OCR hoàn tất.";

        }

        catch (error) {

            console.error(error);

            status.textContent =
                "❌ OCR lỗi: " +
                error.message;
        }


        ocrButton.disabled = false;
    }
);
