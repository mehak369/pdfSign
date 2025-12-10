import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
const API_BASE_URL="https://pdfsign-backend.onrender.com";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

let CounterFieldId = 1;
export default function PdfEditor({ selectedFieldType }) {
  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://your-render-backend-url.onrender.com";
  const [numPages, setNumPages] = useState(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [fields, setFields] = useState([]);
  const [signatureImageBase64, setSignatureImageBase64] = useState("");
  const [activeFieldId, setActiveFieldId] = useState(null);

  const pageWrapper = useRef(null);
  const dragStateRef = useRef(null);
  const resizeStateRef = useRef(null);

  const pdfUrl = `${API_BASE_URL}/pdf/sample`;
  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  useEffect(() => {
    if (!pageWrapper.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      setPageSize({ width, height });
    });

    observer.observe(pageWrapper.current);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const handleMouseMove = (e) => {
      const dragState = dragStateRef.current;
      if (dragState && pageSize.width && pageSize.height) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        const newXPx = dragState.startXPx + dx;
        const newYPx = dragState.startYPx + dy;

        const newXRel = newXPx / pageSize.width;
        const newYRel = newYPx / pageSize.height;

        setFields((prev) =>
          prev.map((f) =>
            f.id === dragState.id
              ? { ...f, x_relative: newXRel, y_relative: newYRel }
              : f
          )
        );
      }

      const resizeState = resizeStateRef.current;
      if (resizeState && pageSize.width && pageSize.height) {
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        const newWidthPx = Math.max(20, resizeState.startWidthPx + dx);
        const newHeightPx = Math.max(16, resizeState.startHeightPx + dy);

        const newWRel = newWidthPx / pageSize.width;
        const newHRel = newHeightPx / pageSize.height;

        setFields((prev) =>
          prev.map((f) =>
            f.id === resizeState.id
              ? { ...f, w_relative: newWRel, h_relative: newHRel }
              : f
          )
        );
      }
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pageSize.width, pageSize.height]);

  const DragHandler = (e) => {
    e.preventDefault();
  };

  const DropHandler = (e) => {
    e.preventDefault();

    const fieldType = e.dataTransfer.getData("fieldType");
    if (
      !fieldType ||
      !pageWrapper.current ||
      !pageSize.width ||
      !pageSize.height
    ) {
      return;
    }

    const rect = pageWrapper.current.getBoundingClientRect();

    const x_px = e.clientX - rect.left;
    const y_px = e.clientY - rect.top;

    const defaultWidth = pageSize.width * 0.2;
    const defaultHeight = pageSize.height * 0.05;

    const x_relative = x_px / pageSize.width;
    const y_relative = y_px / pageSize.height;
    const w_relative = defaultWidth / pageSize.width;
    const h_relative = defaultHeight / pageSize.height;

    const newField = {
      id: CounterFieldId++,
      type: fieldType,
      page: 1,
      x_relative,
      y_relative,
      w_relative,
      h_relative,
    };

    setFields((prev) => [...prev, newField]);
    setActiveFieldId(newField.id);
  };

  const handleTapPlace = (e) => {
    if (window.innerWidth >= 768) return; // only on small screens
    if (!selectedFieldType) return;
    if (!pageWrapper.current || !pageSize.width || !pageSize.height) return;

    const rect = pageWrapper.current.getBoundingClientRect();
    const x_px = e.clientX - rect.left;
    const y_px = e.clientY - rect.top;

    const defaultWidth = pageSize.width * 0.2;
    const defaultHeight = pageSize.height * 0.05;

    const x_relative = x_px / pageSize.width;
    const y_relative = y_px / pageSize.height;
    const w_relative = defaultWidth / pageSize.width;
    const h_relative = defaultHeight / pageSize.height;

    const newField = {
      id: CounterFieldId++,
      type: selectedFieldType,
      page: 1,
      x_relative,
      y_relative,
      w_relative,
      h_relative,
    };

    setFields((prev) => [...prev, newField]);
    setActiveFieldId(newField.id);
  };

  const toPixelRect = (field) => {
    return {
      left: field.x_relative * pageSize.width,
      top: field.y_relative * pageSize.height,
      width: field.w_relative * pageSize.width,
      height: field.h_relative * pageSize.height,
    };
  };

  const getFieldClasses = (type, isActive) => {
    const base =
      "absolute flex items-center justify-center rounded-md text-[11px] font-semibold shadow-md border-2";
    const active = isActive ? " ring-2 ring-blue-400" : "";
    switch (type) {
      case "signature":
        return (
          base +
          " border-blue-500 bg-blue-50/70 border-dashed text-blue-700" +
          active
        );
      case "text":
        return (
          base +
          " border-emerald-500 bg-emerald-50/70 text-emerald-700" +
          active
        );
      case "date":
        return (
          base + " border-amber-500 bg-amber-50/70 text-amber-700" + active
        );
      case "stamp":
        return (
          base + " border-rose-500 bg-rose-50/70 text-rose-700" + active
        );
      default:
        return (
          base + " border-slate-400 bg-slate-50/70 text-slate-700" + active
        );
    }
  };

  const toPdfBox = (field) => {
    const pdfWidth = 595;
    const pdfHeight = 842;

    const x = field.x_relative * pdfWidth;
    const width = field.w_relative * pdfWidth;

    const boxTop = field.y_relative * pdfHeight;
    const height = field.h_relative * pdfHeight;

    const y = pdfHeight - (boxTop + height);

    return {
      page: field.page - 1,
      x,
      y,
      width,
      height,
    };
  };

  const handleSignClick = async () => {
    try {
      if (!signatureImageBase64) {
        alert("Kindly upload a signature image first.");
        return;
      }

      const signatureField = fields.find((f) => f.type === "signature");
      if (!signatureField) {
        alert("Place at least one SIGNATURE box on the PDF in order to continue.");
        return;
      }

      const box = toPdfBox(signatureField);

      const payload = {
        pdfId: "sample",
        signatureImageBase64,
        box,
      };

      const response = await fetch(`${API_BASE_URL}/sign-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Sign error:", errData);
        alert("Sorry! Failed to sign PDF.");
        return;
      }

      const data = await response.json();
      console.log("Signed response:", data);

      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        alert("Signed URL not returned from the server.");
      }
    } catch (err) {
      console.error("Error in handleSignClick:", err);
      alert("Oops!! Unexpected error while signing PDF.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={pageWrapper}
        onDragOver={DragHandler}
        onDrop={DropHandler}
        onClick={handleTapPlace}     
        className="relative inline-block w-full max-w-[800px] shadow-md bg-slate-200"
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="flex h-64 w-64 items-center justify-center text-sm text-blue-600">
              Just a minute! Loading the PDF...
            </div>
          }
          error={
            <div className="flex h-64 w-64 items-center justify-center text-center text-red-900 bg-white border border-red-700 rounded-md p-5">
              Failed to load the PDF. Check the backend URL.
            </div>
          }
        >
          {numPages && (
            <Page
              pageNumber={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          )}
        </Document>

        <div className="pointer-events-none absolute inset-0">
          {fields.map((field) => {
            const rect = toPixelRect(field);
            const isActive = field.id === activeFieldId;

            return (
              <div
                key={field.id}
                className={`${getFieldClasses(
                  field.type,
                  isActive
                )} pointer-events-auto`}
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setActiveFieldId(field.id);
                  dragStateRef.current = {
                    id: field.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    startXPx: rect.left,
                    startYPx: rect.top,
                  };
                }}
              >
                {field.type.toUpperCase()}
                <div
                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 rounded-full cursor-se-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveFieldId(field.id);
                    resizeStateRef.current = {
                      id: field.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startWidthPx: rect.width,
                      startHeightPx: rect.height,
                    };
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-1">
        <div className="flex flex-col items-center gap-1">
          <label
            htmlFor="signature-upload"
            className="text-sm text-white border-2 mt-3 hover:text-base hover:text-slate-200 px-3 py-2"
          >
            Upload signature image (PNG/JPG)
          </label>
          <input
            id="signature-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                setSignatureImageBase64(reader.result);
              };
              reader.readAsDataURL(file);
            }}
            className="text-[11px]"
          />
        </div>

        <button
          onClick={handleSignClick}
          className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-neutral-800 hover:bg-cyan-200"
        >
          Sign PDF with uploaded Signature image
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-1">
        Rendered page:{" "}
        {pageSize.width ? Math.round(pageSize.width) : 0} ×{" "}
        {pageSize.height ? Math.round(pageSize.height) : 0} px · Fields:{" "}
        {fields.length}
      </p>
      <p className="text-xl text-slate-400 border-2">
        If you are using a mobile, tap on the box and then tap on the PDF to place it.
        Pease do not drag.
      </p>
    </div>
  );
}
