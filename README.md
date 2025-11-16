# 🧩 Diversified — Advance Template via Suitelet  
### Dynamic PDF + CSV Export Engine for NetSuite (SuiteScript 2.x / 2.1)  
**© 2025 — Shahmeer Khan**

---

![Banner](https://dummyimage.com/1200x260/0f0f0f/ffffff&text=Diversified+Advance+Estimator+Template+Suitelet)

<div align="center">

📄 **Dynamic PDF Rendering** • 🧮 **Estimator Engine** • 📊 **CSV Export** • 🏗️ **Rooms, Labor & Misc Breakdown**

</div>

---

## 🚀 Overview

This repository contains a **powerful, production-grade Suitelet** used to generate:

### ✔ Fully Branded, Multi-Section PDF Estimator  
### ✔ CSV Export Utility (printable/downloadable)  
### ✔ Dynamic Line-Item Rendering (Rooms → Labor → Misc)  
### ✔ Header/Footer Macros, Custom Fonts & Styling  
### ✔ Secure User-Scoped Record Fetching  
### ✔ File-Based Saved Data Retrieval

This Suitelet is used by *Diversified* to generate detailed estimation PDFs based on saved data stored in NetSuite records + JSON auxiliary files.

---

# 🏗️ What This Suitelet Does

### **1️⃣ Renders a Complete PDF Estimator**

The script dynamically generates a full XHTML-to-PDF template including:

- Company logo  
- Timestamp  
- Header & footer macros  
- Custom fonts (Arabic, Comforta, NotoSans)  
- Main details (Customer, Project, Opportunity, System ID, etc.)  
- Sub-header Sections  
- Item tables  
- Room subtotals  
- Labor Plan section  
- Miscellaneous Materials section  
- Final Quote Summary  
- Grand Total

Every numeric value is properly rounded and formatted.

---

### **2️⃣ Pulls Saved Estimator Data From:**
✔ NetSuite Record  
✔ JSON File in File Cabinet  

The JSON structure includes:

- `roomsdata`  
- `labordata`  
- `miscdata`  

This allows extremely large and complex estimator configurations to be saved outside the NetSuite record size limit.

---

### **3️⃣ CSV Export Suitelet (Secondary Script)**

A second Suitelet allows users to export the estimator in CSV form:

- Creates a CSV file on the fly  
- Sets proper headers  
- Prompts the browser to download `EstimatorData.csv`

Ideal for Excel workflows or offline record keeping.

---

# 🧠 Key Capabilities

### 🔍 **User-Based Record Security**  
The Suitelet ensures a user can only print/export estimator files they own:

```js
["owner.internalid","anyof", userId]

```

### 📄 Advanced PDF Engine

Uses response.renderPdf() with:

Dynamic tables

Conditional row styling (headers, subheaders, items)

Full HTML/CSS layout

Multi-level grouping (Rooms → Items → Totals)

Item ID

### 📂 Project Modules & Responsibilities
File	Purpose
Suitelet (Main)	Generates the PDF with full estimator breakdown
Suitelet (CSV)	Generates & downloads EstimatorData.csv
div_tpc_constant.js	Constants for record type, fields, file path
File Cabinet JSON files	Holds saved estimator line data


### 📝 License

MIT License
Copyright (c) 2025
Shahmeer Khan
