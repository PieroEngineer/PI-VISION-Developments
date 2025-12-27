(function (PV) {
    "use strict";

    function symbolVis() {}
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: "temporal_graph",
        displayName: "Temporal_graph",
        iconUrl: "Scripts/app/editor/symbols/ext/icons/temporal_graph.png",
        visObjectType: symbolVis,
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Single,
        getDefaultConfig: () => (
            {
                DataShape: "TimeSeries",
                Height: 300,
                Width: 800,
            }
        ),
        configOptions: function () {
            return [
                {
                    title: "No Configuration",
                    mode: "format"
                }
            ];
        }
    };

    symbolVis.prototype.init = function (scope, elem) {
        const container = elem.find('#temporal_chart-container')[0];
        if (!container) return;

        this.onDataUpdate = function (data) {
            container.innerHTML = '';

            if (!data || !data.Data || !data.Data[0]) return;

            const vals = data.Data[0].Values
                .map(p => parseFloat(p.Value))
                .filter(v => !isNaN(v));

            if (vals.length === 0) return;

            const dates = data.Data[0].Values
                .map(p => p.Time.toString())

            if (dates.length === 0) return;
            
            try {
                drawchart(container, vals, dates);
            } catch (err) {
                console.error("Chart rendering error:", err);
            }

        };

        //--------------------PRINCIPAL FUNCTIONS--------------------\\
        
        //--------Drawing--------\\
        function drawchart(container, data, dates){

            container.innerHTML = "";

            const width = container.offsetWidth;
            const height = container.offsetHeight;

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", width);
            svg.setAttribute("height", height);
            
            const tbl_top_left_x = width*(7.5/198.5);
            const tbl_top_y = 0;
            
            const character_size = width/85 /// This should depent of the range

            const n_v_lines = 10
            
            const limits = get_limits(data)
            
            /// const safeSup = isNaN(limits.sup) ? limits.max_data : limits.sup;
            /// const safeInf = isNaN(limits.inf) ? limits.min_data : limits.inf;
            
            /// const max_min_t = [Math.max(limits.max_data, safeSup), Math.min(limits.min_data, safeInf)]
            const max_min_t = [Math.max(limits.max_data, limits.sup), Math.min(limits.min_data, limits.inf)]
            
            const chart_with = width*.9
            const chart_height = height*.9
            
            const margin_x = width/30
            const margin_y = height/16
            
            // Generate Y-axis text
            const y_text = y_axis_text(tbl_top_left_x, tbl_top_y, chart_height, margin_y, max_min_t, character_size)
            svg.appendChild(y_text)

            // // Generate X-axis text
            const x_text = x_axis_text(tbl_top_left_x, tbl_top_y, chart_height, chart_with, n_v_lines, margin_x, dates, character_size)
            svg.appendChild(x_text)

            // Generate grid
            const base_grid = grid(tbl_top_left_x, tbl_top_y, chart_with, chart_height, margin_x, margin_y, n_v_lines, max_min_t)
            svg.appendChild(base_grid)
            
            // Generate trend
            const current_trend = trend(tbl_top_left_x, tbl_top_y, margin_x, margin_y, chart_with - 2*margin_x, chart_height - 2*margin_y, data, max_min_t)
            svg.appendChild(current_trend)

            /// Generate envelope lines
            const current_envelope_lines = envelope_lines(tbl_top_left_x, tbl_top_y, margin_x, margin_y, chart_with - 2*margin_x, chart_height - 2*margin_y, limits, max_min_t)
            svg.appendChild(current_envelope_lines)

            container.appendChild(svg);
        };

        //--------------------BUILD GRAPHICS FUNCTIONS--------------------\\

        //-------Calculations-----\\
        function get_limits(data){
            let sorted = data.slice();

            sorted.sort((a, b) => a - b)

            const q1 = percentile(sorted, 25);
            const q3 = percentile(sorted, 75);
            const ric = q3 - q1;

            const inf = q1 - 1.5 * ric;
            const sup = q3 + 1.5 * ric;

            const min_data = Math.min(...data);
            const max_data = Math.max(...data);
            
            return {
                "max_data": max_data,
                "min_data": min_data,
                "sup": sup,
                "inf": inf
            }
        }

        //-------GRAPHS-------\\
        function envelope_lines(x, y, margin_x, margin_y, net_width, net_height, limits, max_min_t){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            group.setAttribute("transform", `translate(${x}, ${y})`);

            const min_t = max_min_t[1];
            const max_t = max_min_t[0];

            const y_fixer = element => net_height*(1 - (element-min_t)/(max_t-min_t));  // From context values to pixels units

            // Lower envelope line
            const pos_inf = net_height + margin_y - y_fixer(limits.inf)
            const inf_env = line(margin_x, pos_inf, margin_x + net_width, pos_inf, 'black', 2, false)
            group.appendChild(inf_env);

            // Upper envelope line
            const pos_sup = net_height + margin_y - y_fixer(limits.sup)
            const sup_env = line(margin_x, pos_sup, margin_x + net_width, pos_sup, 'black', 2, false)
            group.appendChild(sup_env);

            return group

        }

        function grid(x, y, gross_width, gross_height, margin_x, margin_y, n_v_lines, max_min_t){  // Adapted to this context
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${x}, ${y})`);

            // Margin behaviors
            const net_width = gross_width - 2*margin_x
            const net_height = gross_height - 2*margin_y

            // Border location
            const r = rectangle(0, 0, gross_width, gross_height, 1.5, 'black');
            group.appendChild(r);

            // Loop for vertical lines
            let sep = net_width/(n_v_lines - 1);
            for (let i = 0; i < n_v_lines; i++){
                const l = line(margin_x + i*sep, 0, margin_x + i*sep , gross_height, 'gray')
                group.appendChild(l)
            }

            // Loop for horizontal lines
            const range = max_min_t[0]-max_min_t[1]
            // sep = 50*net_height/range;   // 50 value units to pixel units     // 50 -> range/8  8 hor. line

            sep = net_height/8
            for (let i = 0; gross_height > (margin_y + i*sep); i++){

                const l = line(0, gross_height - margin_y - i*sep, gross_width, gross_height - margin_y - i*sep, 'gray')
                group.appendChild(l)
            }

            return group;
        }

        function trend(x, y, margin_x, margin_y, net_width, net_height, data, max_min_t, thickness = .5, is_conti = true, color = '#6683b7'){

            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            const min_t = max_min_t[1];
            const max_t = max_min_t[0];

            const y_fixer = element => net_height*(1 - (element-min_t)/(max_t-min_t));  // From context values to pixels units
            
            const sep_x = net_width/(data.length-1);

            // Move the entire group
            group.setAttribute("transform", `translate(${x + margin_x}, ${y + margin_y})`); 

            if (is_conti){
                const cir = circle(0, y_fixer(data[0]));
                group.appendChild(cir)
            }
            for (let i = 0; i < data.length-1; i++){

                const line_stroke = line((i)*sep_x, y_fixer(data[i]), (i+1)*sep_x, y_fixer(data[i+1]), color, thickness, is_conti)
                group.appendChild(line_stroke)

                if (is_conti){
                    const cir = circle((i+1)*sep_x, y_fixer(data[i+1]));
                    group.appendChild(cir)
                }
            }

            return group
        }

        function y_axis_text(x, y, gross_height, margin_y, max_min_t, character_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${x - character_size*1.7}, ${y})`);

            const range = max_min_t[0] - max_min_t[1]

            const net_height = gross_height - 2*margin_y

            //const sep_y = 50*net_height/range         // 50 -> range/8    8 hor. line
            const sep_y = net_height/8
            //const n_h_lines_assigned = Math.floor(range/50) + 1     // 50 -> range/8    8 hor. line
            const n_h_lines_assigned = 8 + 1 //Math.floor(8) + 1

            console.log('n_h_lines_assigned in y_axis: ', n_h_lines_assigned)

            for(let i = 0; i < n_h_lines_assigned; i++){  
                
                console.log('i in y_axis: ', i)

                //const txt = text((i*50 + max_min_t[1]).toFixed(2).toString(), -character_size/2 - 8, gross_height - margin_y - i*sep_y + (character_size/2 - 1), character_size)
                const txt = text((i*range/8 + max_min_t[1]).toFixed(2).toString(), 0, gross_height - margin_y - i*sep_y + (character_size/2 - 1), character_size)
                group.appendChild(txt)
            }

            return group
        }

        function x_axis_text(x, y, gross_height, gross_width, n_v_lines, margin_x, dates, character_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            group.setAttribute("transform", `translate(${x + margin_x}, ${y + gross_height*1.04})`);

            const net_width = gross_width - 2*margin_x

            const sep_x = net_width/(n_v_lines - 1)

            /// PI VISION example -> 8/1/2025 7:37:12.003326 AM (String)   Month/Day/Year
            const start_date = new Date(dates[0])
            for (let i = 0; i < n_v_lines; i++) {
            const new_date = new Date(start_date.getTime() + i*900000*Math.ceil(dates.length/n_v_lines)); // Add 15 minutes
            const new_date_str = new_date.toLocaleString('en-GB', { hour12: true })
            const new_date_slc = new_date_str.slice(0, new_date_str.indexOf(','))

            ///const txt = text(new_date_str, i*sep_x, i*10)
            const txt = text(new_date_slc, i*sep_x, character_size/2, character_size)
            group.appendChild(txt)
            }

            return group
        }

        //--------------------FUNDAMENTAL FUNCTIONS--------------------\\

        //-------Calculations-----\\

        // Percentile
        function percentile(arr, p) {
            const idx = (p / 100) * (arr.length - 1);
            const lower = Math.floor(idx);
            const upper = Math.ceil(idx);
            return lower === upper
                ? arr[lower]
                : arr[lower] + (arr[upper] - arr[lower]) * (idx - lower);
        }

        //-------GRAPHS-----\\

        // Generate line
        function line(x1, y1, x2, y2, color, width = 1, is_cont = true) {
            const l = document.createElementNS( "http://www.w3.org/2000/svg", "line" );
            l.setAttribute("x1", x1);
            l.setAttribute("y1", y1);
            l.setAttribute("x2", x2);
            l.setAttribute("y2", y2);
            l.setAttribute("stroke", color);
            l.setAttribute("stroke-width", width);
            if(!is_cont){
            l.setAttribute('stroke-dasharray', '5,5');
            }

            return l;
        }
 
        // Generate rectangle
        function rectangle(x1, y1, x2, y2, stroke_width = 1, stroke_color = 'gray', alpha = 1, fill_color = 'none'){
            const  rec = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            
            rec.setAttribute("x", x1)
            rec.setAttribute("y", y1)
            rec.setAttribute("width", x2 - x1);
            rec.setAttribute("height", y2 - y1);
            rec.setAttribute("fill", fill_color);
            rec.setAttribute("fill-opacity", alpha);
            rec.setAttribute("stroke", stroke_color);
            rec.setAttribute("stroke-width", stroke_width);
            rec.setAttribute("stroke-opacity", alpha);

            return rec
        }

        // Generate text
        function text(txt, x, y, fontSize = '8px', rotation = 0, anchor = 'middle', weight = 'normal') {
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', x);
            t.setAttribute('y', y);
            t.setAttribute('text-anchor', anchor);
            t.setAttribute('font-size', fontSize);
            t.setAttribute('font-weight', weight);
            t.setAttribute('font-family', 'Sans-serif');
            t.setAttribute('fill', 'black');
            t.setAttribute('transform', `rotate(${rotation}, ${x}, ${y})`);
            t.textContent = txt;
            return t;
        }

        // Generate circle
        function circle(cx, cy, r = 2, strokeColor = '#6683b7', strokeWidth = 1, fillColor = '#6683b7') {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', cx);
            c.setAttribute('cy', cy);
            c.setAttribute('r', r);
            c.setAttribute('stroke', strokeColor);
            c.setAttribute('stroke-width', strokeWidth);
            c.setAttribute('fill', fillColor);
            return c;
        }
    };
    PV.symbolCatalog.register(definition);
})(window.PIVisualization);