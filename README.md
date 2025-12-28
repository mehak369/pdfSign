Signature Injection Engine (Prototype)

This project is a MERN-based prototype that demonstrates how a signature field placed on a responsive web PDF viewer can be embedded into a static PDF at the exact same position.

The main focus of this project is reliability — ensuring that what a user sees on the screen is exactly what gets written into the final signed PDF.

--------------------------

PROBLEM STATEMENT

Web browsers and PDF files use completely different coordinate systems.

Browsers (Frontend):

Coordinates are based on CSS pixels

Origin starts from the top-left corner

Layout is responsive and changes across desktop, tablet, and mobile screens

PDFs (Backend):

Coordinates are based on points (72 DPI)

Origin starts from the bottom-left corner

Layout is fixed and does not change

Because of this mismatch, a signature that looks correctly placed in the browser can appear at a wrong location inside the final PDF.
This is a serious issue for legal documents, contracts, and consent forms.

-----------------------------

WHAT THIS PROJECT SOLVES

This prototype solves the mismatch between browser coordinates and PDF coordinates by introducing a relative coordinate system.

Instead of storing absolute pixel values, the system stores the position and size of each field as a ratio relative to the PDF container.

This guarantees:

Consistent placement across all screen sizes

Accurate conversion to PDF coordinates

Pixel-perfect burn-in of the signature

--------------------------------

CORE SOLUTION IDEA

All placements are stored as relative values:

x_relative = x_position / container_width
y_relative = y_position / container_height

These relative values:

Remain the same on desktop, tablet, and mobile

Can be converted back to pixels for screen preview

Can be converted to PDF points for final rendering

This single design decision ensures reliability across environments.

-----------------------

FRONTEND OVERVIEW (REACT)

The frontend is built using React and react-pdf.

Key features:

Renders a PDF inside the browser

Allows users to place a signature box using drag (desktop) or tap (mobile)

Allows resizing of the box

Supports uploading a signature image (PNG or JPG)

---------------------------

How placement works:

User places a field on the PDF

Mouse or touch coordinates are captured

Coordinates are converted to relative values

Relative values are stored in state

For preview, relative values are multiplied by current container size

This ensures the box stays visually anchored even if screen size changes.

------------------------------

BACKEND OVERVIEW (NODE + EXPRESS)

The backend is responsible for converting the frontend placement into a final signed PDF.

Responsibilities:

Serve the sample PDF

Accept signature image and placement data

Convert relative coordinates into PDF points

Embed the signature image into the PDF

Return a URL to the signed PDF

The backend uses the pdf-lib library to manipulate PDF files.

--------------------------------

PDF COORDINATE CONVERSION

PDF pages use:

Fixed width (A4 = 595 points)

Fixed height (A4 = 842 points)

Origin at the bottom-left corner

To handle this:

X coordinates are scaled directly

Y coordinates are inverted

Image is scaled proportionally to fit inside the box

Image is centered without distortion

This ensures mathematical correctness, not just visual correctness.

-------------------------------------

SECURITY AND AUDIT TRAIL

To maintain trust and integrity, the backend computes:

SHA-256 hash of the original PDF

SHA-256 hash of the signed PDF

These hashes are stored in MongoDB along with timestamps.

This provides:

Proof of document integrity

Audit history

Tamper detection

-----------------------

DEPLOYMENT ARCHITECTURE

Frontend:

Deployed on Netlify as a static React application

Backend:

Deployed on Render as a Node.js service

Database:

MongoDB Atlas

The frontend communicates with the backend using the deployed API URL.

-----------------------------

HOW TO RUN THE PROJECT LOCALLY

Clone the repository:

git clone https://github.com/mehak369/pdfSign.git

cd pdfSign

Start backend:

cd backend
npm install
npm run dev

Start frontend (new terminal):

cd frontend
npm install
npm run dev

---------------------------
WHAT THIS PROJECT IS AND IS NOT

This project IS:

A focused technical prototype

A demonstration of coordinate accuracy

A solution for reliable signature placement

--------------

This project IS NOT:

A full production e-sign platform

A multi-user signing system

A complete form builder

Those features can be built on top of this foundation.
-------------------------

WHY THIS MATTERS

In document signing systems, visual placement is not enough.

What matters is:

Mathematical correctness

Device independence

Final PDF accuracy

This project demonstrates a robust approach to bridging responsive web interfaces with static PDF formats.

_______

CONCLUSION

BoloSign proves that responsive UIs and static PDFs can work together reliably when relative coordinate systems are used.

This prototype lays a strong foundation for real-world digital signing solutions where accuracy is non-negotiable.
