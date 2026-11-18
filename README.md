# Tool Management System (TMS) - React + Vite + Tailwind CSS

A modern enterprise tooling lifecycle and preventive maintenance application built with **React 18**, **Vite**, and **Tailwind CSS**.

## ✨ Features & Client Specifications

1. **Master List**:
   - Registered 8 specification fields: **Application Part No**, **Product Name**, **Tool No**, **Description**, **Tool Issued On**, **Life Time**, **Classification**, **Tool Count**.
   - **Application Part No as Parent**: Supports multiple tools belonging to the same part number (e.g., `001 -> INE T 1122`, `001 -> INE T 1133`, `002 -> INE T 0652`).
   - **Searchable Combobox**: Numbers-only suggestions that filter as you type, select on click/keyboard, or enter a new part number.
   - **Classification Dropdown**: Strictly contains **Critical** and **Non-Critical** options.
   - **Life Time**: Starts blank by default (no prefilled values).
   - **Tool Count (Cycle Count)**: Auto-calculated read-only cycle count (starts at 0, increments to 1, 2... as cumulative output fulfills the life time limit).
   - **Dynamic Check Points Matrix**: Starts with a single empty row by default, multi-line auto-expanding textarea, 38×38px red delete button (`✕`), and a `+ Add Check Point` button.
   - **Filters & Search**: Includes a search bar, Classification filter, Status filter, and a perfectly aligned **Reset** button.
   - **Export to CSV**: Client-side one-click CSV generation.

2. **Tool Service & Lifecycle (Production Tracking)**:
   - Tool selector pills for switching active tools (`INE T 1122`, `INE T 1133`, etc.).
   - Tool Master specification & wear bar.
   - Inspection check points list.
   - **Quantity Produced Table**: Monthly logs with real-time recalculation of Cumulative Output, Remaining Balance, and status transitions (*Active*, *Near Limit*, *Replacement Due*).
   - *(Service History Records table removed per user request).*

3. **Dashboard & Fleet Analytics**:
   - Executive KPIs: Total Fleet, Active Tools, Replacement Alerts, Total Strokes Output.
   - Overall fleet health distribution progress bar.
   - Urgent lifecycle attention table.

4. **Production Tracking**:
   - Plant-wide strokes tracking across all application part numbers.

5. **Replacement Alerts**:
   - Preventive warnings categorized by *Replacement Due* (≥100% wear) and *Near Limit* (80%–99% wear).

6. **Audit Reports**:
   - IATF / ISO printable audit sheets with signature sign-offs and CSV export.

---

## 🚀 Running the Project

### Development Server:
```bash
npm run dev
```
Runs Vite dev server with instant Hot Module Replacement (HMR) at [http://localhost:3000](http://localhost:3000).

### Production Build:
```bash
npm run build
```
Compiles optimized assets to the `dist/` directory.

### Preview Production Build:
```bash
npm run preview
```
