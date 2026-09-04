# Tool Management System (TMS)

A modern enterprise web application prototype for manufacturing plants to digitize manual **Tool Master Cards** and **Tool Service History Cards**.

## Features
- **Dashboard**: Executive and shop-floor overview with real-time KPI metrics, tool wear status donut chart, monthly output volume bar chart, and recent service activity feed.
- **Tool Master**: Digital Tool Master Card with multi-parameter search/filters, machine specs, dynamic spare parts matrix, and approval sign-offs.
- **Tool Service History**: Digital Tool Service History Card with prominent tool search, historical maintenance actions, and real-time quantity produced tracking.
- **Dynamic Auto-Calculation Engine**:
  - $\text{Cumulative Quantity} = \text{Previous Cumulative} + \text{Current Month Quantity}$
  - $\text{Remaining Balance} = \max(0, \text{Replacement Frequency} - \text{Cumulative Quantity})$
  - Dynamic status transitions: **Healthy** ($<80\%$), **Near Limit** ($80\% - 99\%$), and **Replacement Due** ($\ge 100\%$).
- **Production Tracking**: Plant-wide tool output matrix and batch quantity logging.
- **Replacement Alerts**: Real-time preventive maintenance thresholds and replacement scheduling.
- **Enterprise Reports**: Pre-configured audit reports with interactive preview, client-side CSV export, and print formatting.

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Client-side `localStorage` data persistence with restore demo defaults utility
- Zero external dependencies

## Running Locally
Run with any modern browser by opening `index.html`, or serve with Node.js:
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
