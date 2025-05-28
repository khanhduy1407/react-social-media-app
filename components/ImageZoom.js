import { useEffect, useRef, useState } from "react";

export default function ImageZoom({ src, alt = "", className = "" }) {
  const imgRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [elements, setElements] = useState({ overlay: null, clone: null });

  // Ngăn scroll khi zoom
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  const zoomIn = () => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();

    // Tạo bản sao ảnh
    const clone = img.cloneNode();
    clone.style.position = "fixed";
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.zIndex = "50";
    clone.style.transition = "all 500ms ease";
    clone.style.objectFit = "contain";
    clone.style.cursor = "zoom-out";
    clone.dataset.originalTop = rect.top;
    clone.dataset.originalLeft = rect.left;
    clone.dataset.originalWidth = rect.width;
    clone.dataset.originalHeight = rect.height;

    // Lớp overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "40";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 500ms ease";
    overlay.style.cursor = "zoom-out";

    // Gắn sự kiện click để thu nhỏ
    const zoomOut = () => {
      overlay.style.opacity = "0";
      clone.style.top = `${clone.dataset.originalTop}px`;
      clone.style.left = `${clone.dataset.originalLeft}px`;
      clone.style.width = `${clone.dataset.originalWidth}px`;
      clone.style.height = `${clone.dataset.originalHeight}px`;
      clone.style.transform = "translate(0, 0)";

      setTimeout(() => {
        overlay.remove();
        clone.remove();
        setElements({ overlay: null, clone: null });
        setIsZoomed(false);
      }, 300);
    };

    clone.onclick = zoomOut;
    overlay.onclick = zoomOut;

    document.body.appendChild(overlay);
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      clone.style.top = "50%";
      clone.style.left = "50%";
      clone.style.width = "90vw";
      clone.style.height = "90vh";
      clone.style.transform = "translate(-50%, -50%)";
    });

    setElements({ overlay, clone });
    setIsZoomed(true);
  };

  const handleClick = () => {
    if (!isZoomed) zoomIn();
    // Khi isZoomed = true thì clone & overlay tự xử lý zoomOut qua sự kiện click
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onClick={handleClick}
      className={`${className} cursor-zoom-in`}
    />
  );
}
