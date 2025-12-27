
# PI Vision Custom Symbols (No external libraries)

This repository contains **three PI Vision custom symbols** implemented in vanilla JavaScript/SVG to avoid incompatibilities with third‑party libraries. They are designed to run **only inside a PI Vision Extensibility environment** and rely on PI Vision's `PV` API (`window.PIVisualization`).

- **Boxplot**: renders a statistical boxplot with whiskers, median and outliers.
- **Maximum Graph**: draws a multi‑trend line/threshold chart plus legend and data table.
- **Maximum Table**: renders a summary table of maxima per period using SVG text.

> **Why no libraries?** In some PI Vision deployments, bundling or loading external libraries (e.g., D3/Plotly) is blocked or leads to version conflicts. These symbols are therefore implemented using `document.createElementNS(...)` for SVG primitives and the PI Vision symbol base class. In addition, the company required highly customed symbols.

---

## Some example Files

- `sym-boxplot.js` — custom symbol type name: `boxplot`; datasource behavior: **Single**;.
- `sym-maximum_graph.js` — custom symbol type name: `maximum_graph`; datasource behavior: **Multiple**;.
- `sym-maximum_table.js` — custom symbol type name: `maximum_table`; datasource behavior: **Single**; .

> Each file calls `PV.symbolCatalog.register(definition)` and uses `elem.find('#...-container')[0]` to locate an HTML container.

---

## Installation (PI Vision Extensibility)

> **Prerequisites:** PI Vision Extensibility must be enabled by your administrator. You need access to the PI Vision web server file system.

1. **Copy JS files** into your PI Vision installation under:
   
   ```text
   <PIVisionInstallRoot>/Scripts/app/editor/symbols/ext/
   ```

2. **Provide icons (PNG, ~32–64px)** at:
   
   ```text
   <PIVisionInstallRoot>/Scripts/app/editor/symbols/ext/icons/
   ```
   with filenames:
   - `boxplot.png`
   - `maximum_graph.png`
   - `maximum_table.png`

3. **Create simple HTML templates** for each symbol in the same `ext` folder. Minimal examples:
   
   - **Boxplot** (`sym-boxplot-template.html`)
     ```html
     <div id="boxplot-container" style="width:100%;height:100%"></div>
     ```
   - **Maximum Graph** (`sym-maximum_graph-template.html`)
     ```html
     <div id="maximum_chart-container" style="width:100%;height:100%"></div>
     ```
   - **Maximum Table** (`sym-maximum_table-template.html`)
     ```html
     <div id="maximum_table-container" style="width:100%;height:100%"></div>
     ```

   > The IDs must match those used in the `.js` files (e.g., `#maximum_chart-container`, `#maximum_table-container`, `#boxplot-container`).

4. **Recycle the PI Vision application pool / clear browser cache** so PI Vision picks up the new symbols.

5. **Open PI Vision** → Create or edit a display → **Custom Symbols** → select **Boxplot / Maximum Graph / Maximum Table**.

---

## Data binding & expectations

All three symbols expect **TimeSeries** data shape.

### 1) Boxplot (`sym-boxplot.js`)

- **Input**: A single datasource whose values can be used to compute or directly provide the boxplot features.
- **Expected features (conceptual)**:
  - `q1`, `median`, `q3`, `min_limit`, `max_limit`, `lower_outliers[]`, `upper_outliers[]`.
- **Rendering**: Pure SVG lines/rectangles plus diamonds for outliers.
- **Notes**:
  - The code uses helper functions like `line()`, `rectangle()`, `text()`, `rhombus()`.
  - X‑axis ticks are computed from `min`/`max` limits.

> If your datasource does not directly supply those features, adapt the `drawchart(...)` / data conditioning to compute them server‑side (AF Analysis) or within the symbol.

### 2) Maximum Graph (`sym-maximum_graph.js`)

- **Input**: **Multiple** datasources (first 5 traces are used for plotting). Typical mapping:
  1. **Measured series** (points over time).
  2. **Nominal line** (single value or series).
  3. **80% threshold** of nominal.
  4. **Equipment nominal** (derived when `scope.inputModified` is true).
  5. **Equipment 80%**.
- **Behavior**:
  - Date labels are rotated and shown as `Mes Año` (Spanish month abbrev + year).
  - A right‑side table prints `Fecha - Hora` and the value.
  - A legend shows line samples and units.
- **Internals**:
  - `standardize_data(...)` cleans numeric values (strips commas) and builds `{label, unit, vals[], dates[]}`.
  - `get_trend_features(...)` computes global min/max and count for layout.
  - SVG primitives: `rectangle`, `line`, `text`, `circle`.

### 3) Maximum Table (`sym-maximum_table.js`)

- **Input**: Single datasource; the symbol builds a three‑column table:
  - `Mes Año` (Spanish month abbrev + year)
  - `Fecha - Hora` (24‑hour format)
  - `Máx.` (value with 2 decimals)
- **Internals**:
  - `getMonthYearEs(...)` maps month numbers to Spanish abbreviations: `Ene., Feb., Mar., Abr., May., Jun., Jul., Ago., Sept., Oct., Nov., Dic.`
  - `to24HourFormat(...)` converts PI Vision strings like `8/31/2025 10:45 AM` → `8/31/2025 10:45`.

### 4) Others graphs follow similar structure

---

## Limitations & assumptions

- **No external libraries**: All drawing uses SVG primitives; no D3/Plotly/Chart.js.
- **Date parsing assumes PI Vision string format**: `M/D/YYYY h:mm[:ss] AM/PM`. If your locale differs, adjust `getMonthYearEs()` / `to24HourFormat()`.
- **Numeric parsing**: Values are parsed with `parseFloat(...)`, commas stripped. Ensure your tags/attributes produce parseable numbers.
- **Container sizing**: Symbols use `offsetWidth/offsetHeight` of the container; ensure the HTML template sets `width:100%;height:100%`.
- **Icons must exist** at the `icons/` path to avoid 404s in the symbol picker.
- **Styling**: Colors and line types are hard‑coded; change them in the `trend_styles` array (Maximum Graph) or the helper functions.

---

## Troubleshooting

- **Symbol appears blank**:
  - Verify the HTML template contains the exact `div` id required.
  - Check the browser console for messages like `Chart rendering error` or `Data conditioning error`.
  - Ensure datasources return values (`data.Data[i].Values` not empty).
- **Date labels look wrong**: Adjust the locale parsing helpers.
- **Units/labels missing**: The Maximum Graph caches `Label`/`Units` on the first update; verify your attributes provide them.
- **Only thresholds, no line**: `standardize_data(...)` toggles behavior based on `scope.inputModified` and number of traces; review nominal/voltage inputs.

---

## Customization tips

- **Colors & dash styles**: Edit `trend_styles` in `sym-maximum_graph.js`.
- **Outlier markers**: Modify `rhombus(...)` color/size in `sym-boxplot.js`.
- **Fonts**: Change `font-family` in `text(...)` helpers.
- **Rounding**: Use `.toFixed(...)` calls in table renderers.

---

## Credits
- Built by **Piero Olivas**.
