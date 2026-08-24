const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const info = document.getElementById("info");

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    const imageURL = URL.createObjectURL(file);

    preview.innerHTML = `
        <img src="${imageURL}" alt="Ảnh đã chọn">
    `;

    info.innerHTML = `
        <p><strong>Tên file:</strong> ${file.name}</p>
        <p><strong>Kích thước:</strong> ${file.size} bytes</p>
        <p><strong>Loại file:</strong> ${file.type}</p>
    `;
});
