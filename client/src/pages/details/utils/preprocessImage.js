export const preprocessImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                data[i] = data[i + 1] = data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageDataUrl;
    });
};
