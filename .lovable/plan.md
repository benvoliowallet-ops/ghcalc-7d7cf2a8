
## Plan: Clean up header buttons in ProjectSummary

### What to change
In `src/components/ProjectSummary.tsx`, lines 288–338, the header `div` contains 7 buttons:
1. 🖨 Tlačiť — **keep**
2. 📥 Export XLSX — **keep**
3. 📋 Order NAZLI — **remove**
4. 📥 NAZLI XLSX — **remove**
5. 📄 BOM Atti — **remove**
6. 📥 Atti XLSX — **remove**
7. ✏️ Otvoriť wizard — **keep**

Remove buttons 3–6 (lines 303–330). The document section cards at the bottom of the page remain untouched.

### Single edit
- **`src/components/ProjectSummary.tsx`** lines 303–330: delete the 4 document-generation buttons from the header `div`.
