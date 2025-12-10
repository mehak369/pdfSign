import "./App.css";
import { useState } from "react";
import PdfEditor from "./components/PdfEditor";


function App() {
  const fieldTypes = [
    { type: "text", label: "Text" },
    { type: "signature", label: "Signature" },
    { type: "stamp", label: "Stamp" },
    { type: "date", label: "Date" },
  ];

  const DragHandler = (e, fieldType) => {
    e.dataTransfer.setData("fieldType", fieldType);
  };
  const [selectedFieldType, setSelectedFieldType] = useState(null);


  return (
    <div className="min-h-screen flex flex-col font-sans bg-zinc-200">
      <header className="border-b border-slate-200 bg-neutral-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-5xl text-zinc-200 font-semibold text-slate-700">
            BoloSign Signature Injection Engine - A Prototype
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col md:flex-row overflow-hidden"> 
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-200 bg-neutral-800 p-4 flex-shrink-0 flex flex-col">
          <h2 className="text-2xl font-semibold text-zinc-200 mb-3">
            DRAG FROM HERE
          </h2>

          <ul className="space-y-3">
            {fieldTypes.map((f) => (
             <li
                key={f.type}
                draggable
                onDragStart={(e) => DragHandler(e, f.type)}
                onClick={() => setSelectedFieldType(f.type)}
                className="cursor-grab select-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base font-medium text-slate-700 shadow-base hover:bg-slate-300 active:cursor-grabbing"
              >
                {f.label}
              </li>

            ))}
          </ul>

          <div className="mt-6 border-t border-slate-200 pt-3 text-lg text-slate-100">
            1. To upload a Signature, drag the box from above inside the pdf where you want.<br /><br/>
            2. Click the button to upload a signature image.<br /><br/>
            3. Click the Sign PDF with Signature Field button.
          </div>
        </aside>
        <section className="flex-1 p-3 w-full overflow-auto">
          <div className="h-full rounded-xl border border-slate-200 bg-neutral-800 shadow-sm flex items-start justify-center p-4">
            <PdfEditor selectedFieldType={selectedFieldType} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
