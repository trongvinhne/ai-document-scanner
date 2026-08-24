const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("imageCanvas");
const container = document.getElementById("canvasContainer");

const ocrButton = document.getElementById("ocrButton");
const status = document.getElementById("status");
const ocrResult = document.getElementById("ocrResult");

const ctx = canvas.getContext("2d");

let image = new Image();

let scale = 1;

let selecting = false;

let startX = 0;
let startY = 0;

let selection = null;


// ===============================
// CHỌN ẢNH
// ===============================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    const url = URL.createObjectURL(file);

    image.onload = function () {

        drawImage();

        ocrButton.disabled = true;

        status.textContent =
            "👉 Kéo ngón tay quanh vùng mã cần đọc.";

        ocrResult.value = "";

    };

    image.src = url;
});


// ===============================
// HIỂN THỊ ẢNH
// ===============================

function drawImage() {

    const maxWidth = Math.min(
        window.innerWidth - 30,
        700
    );

    scale = maxWidth / image.width;

    canvas.width = maxWidth;

    canvas.height =
        image.height * scale;

    ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (selection) {

        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;

        ctx.strokeRect(
            selection.x,
            selection.y,
            selection.width,
            selection.height
        );
    }
}


// ===============================
// LẤY TỌA ĐỘ NGÓN TAY
// ===============================

function getPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    const touch =
        event.touches[0];

    return {

        x: touch.clientX - rect.left,

        y: touch.clientY - rect.top
    };
}


// ===============================
// BẮT ĐẦU KHOANH VÙNG
// ===============================

canvas.addEventListener(
    "touchstart",
    function (event) {

        event.preventDefault();

        const pos =
            getPosition(event);

        startX = pos.x;

        startY = pos.y;

        selecting = true;

        selection = null;

    },
    { passive: false }
);


// ===============================
// KÉO KHUNG
// ===============================

canvas.addEventListener(
    "touchmove",
    function (event) {

        if (!selecting) {
            return;
        }

        event.preventDefault();

        const pos =
            getPosition(event);

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

        drawImage();

    },
    { passive: false }
);


// ===============================
// KẾT THÚC KHOANH VÙNG
// ===============================

canvas.addEventListener(
    "touchend",
    function () {

        selecting = false;

        if (
            selection &&
            selection.width > 10 &&
            selection.height > 10
        ) {

            ocrButton.disabled = false;

            status.textContent =
                "✅ Đã chọn vùng. Bấm Đọc vùng đã chọn.";
        }

    }
);


// ===============================
// OCR VÙNG ĐÃ CHỌN
// ===============================

ocrButton.addEventListener(
    "click",
    async function () {

        if (!selection) {
            return;
        }

        ocrButton.disabled = true;

        status.textContent =
            "⏳ Đang cắt vùng ảnh...";

        try {

            // Tọa độ trên ảnh gốc
            const sourceX =
                selection.x / scale;

            const sourceY =
                selection.y / scale;

            const sourceWidth =
                selection.width / scale;

            const sourceHeight =
                selection.height / scale;


            // Canvas riêng cho vùng OCR
            const cropCanvas =
                document.createElement("canvas");

            const enlarge = 3;

            cropCanvas.width =
                sourceWidth * enlarge;

            cropCanvas.height =
                sourceHeight * enlarge;

            const cropCtx =
                cropCanvas.getContext("2d");


            cropCtx.drawImage(

                image,

                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,

                0,
                0,
                cropCanvas.width,
                cropCanvas.height

            );


            status.textContent =
                "🔍 Đang OCR vùng đã chọn...";


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

                        tessedit_pageseg_mode: "7"

                    }
                );


            const text =
                result.data.text.trim();


            ocrResult.value =
                text || "Không nhận dạng được.";


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
