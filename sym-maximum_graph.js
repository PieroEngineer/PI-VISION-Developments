(function (PV) {
    "use strict";

    function symbolVis() {}
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: "maximum_graph",
        displayName: "Maximum_graph",
        iconUrl: "Scripts/app/editor/symbols/ext/icons/maximum_graph.png",
        visObjectType: symbolVis,
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
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
        //--------------------CONTAINER CONFIG--------------------\\
        const container = elem.find('#maximum_chart-container')[0];
        if (!container) return;

        //--------------------MANAGING SCOPE--------------------\\
        scope.inputModified = false
        scope.saved_labels = []
        scope.saved_units = []
        
        scope.updateNominalValue = function () {
            // Ensure the value is within bounds
            if (scope.nominalValue < 0) scope.nominalValue = 0;

            try {
                container.innerHTML = ''

                console.log("scope.last_data_obtained:", scope.last_data_obtained)  //V

                const data_object = standardize_data(scope.last_data_obtained)
                if (data_object.length === 0) return

                console.log("data processed:", data_object)  //V

                drawchart(container, data_object)
            } catch(err) {
                console.error("Chart rendering error_:", err)
            }
            scope.inputModified = true
        };

        //--------------------ON UPDATE--------------------\\
        this.onDataUpdate = function (data) {
            container.innerHTML = '';
            if (!data || !data.Data) return

            console.log("data:", data)  //V
            scope.last_data_obtained = data.Data
            
            const data_object = standardize_data(data.Data)

            console.log("data processed:", data_object)  //V

            if (data_object.length === 0) return

            try {
                drawchart(container, data_object)
            }
            catch(err){
                console.error("Chart rendering error", err)
            }

        }

        //--------------------PRINCIPAL FUNCTIONS--------------------\\
        
        //--------Drawing--------\\
        function drawchart(container, trend_object){ 
        // Configuring container
            container.innerHTML = "";

            const container_dimensions = {
                "width": container.offsetWidth,
                "height": container.offsetHeight,
            }

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", container_dimensions.width);
            svg.setAttribute("height", container_dimensions.height);

            // Building main graphs
            const maximum_chart = chart(trend_object, container_dimensions)
            svg.appendChild(maximum_chart)

            container.appendChild(svg);
        }

        //--------------------BUILD GRAPHICS FUNCTIONS--------------------\\

        //-------GRAPHS-------\\

        //--Main graph------------------------------
        function chart(line_object, total_space){

            const chart_group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            const line_features = get_trend_features(line_object)

            console.log('line_features', line_features)

            //--Spacing and styling graphs----------------- // This area should be enought to make any changes in the graph
            const grid_spacing = {  
                'x': total_space.width*.058,
                'y': 0,
                'n_h_lines': 8,     /// Improve this 8 (make it dynamic, no static)
                'width': total_space.width*.633,
                'height': total_space.height*.81
            }
            grid_spacing.horizontal_margin = line_features.n_values>1 ? grid_spacing.width*.047 : grid_spacing.width/2
            grid_spacing.upper_margin = grid_spacing.height*.35
            grid_spacing.lower_margin = grid_spacing.height*.049
            grid_spacing.net_width = grid_spacing.width - 2*grid_spacing.horizontal_margin
            grid_spacing.net_height = grid_spacing.height - (grid_spacing.upper_margin + grid_spacing.lower_margin)
            grid_spacing.x_sep = line_features.n_values>1 ? grid_spacing.net_width/(line_features.n_values-1) : 0
            grid_spacing.y_sep = grid_spacing.net_height/(grid_spacing.n_h_lines-1)

            const y_axis_spacing = {  
                'x': 0,
                'y': grid_spacing.upper_margin,
                'y_sep': grid_spacing.y_sep,
                'n_sep': grid_spacing.n_h_lines,
                'net_height': grid_spacing.net_height
            }

            const x_axis_spacing = {  
                'x': line_features.n_values>1 ? grid_spacing.x*.98 : grid_spacing.width/2,
                'y': total_space.height*.98,
                'x_sep': grid_spacing.x_sep,
                'net_width': grid_spacing.net_width
            }

            const trend_spacing = {
                'x': grid_spacing.x + grid_spacing.horizontal_margin,
                'y': grid_spacing.height - grid_spacing.lower_margin,
                'x_sep': grid_spacing.x_sep,
                'net_height': grid_spacing.net_height,
                'net_width': grid_spacing.net_width
            }

            const table_spacing = {
                'x': grid_spacing.x + grid_spacing.width + total_space.width*.033,
                'y': total_space.height*.031,
                'height': grid_spacing.height
            }
            table_spacing.width = total_space.width - table_spacing.x
            table_spacing.row_sep = table_spacing.height/line_features.n_values
            table_spacing.snd_col_xpos = table_spacing.width*.5

            const legend_spacing = {
                'y': grid_spacing.height*.025,
                'width': grid_spacing.width/2.14
            }
            legend_spacing.x = grid_spacing.x + grid_spacing.width - grid_spacing.width*.015 - legend_spacing.width
            legend_spacing.sep = grid_spacing.height*.047
            legend_spacing.height = (line_features.n_lines+1)*legend_spacing.sep


            const font_size = grid_spacing.height*.045

            const trend_styles = [
                {'color': '#003087', 'is_cont': true}, 
                {'color': '#fe5000', 'is_cont': true}, {'color': '#ffb81c', 'is_cont': false}, 
                {'color': '#23631f', 'is_cont': true}, {'color': '#00b140', 'is_cont': false}
            ]

            //--Graphing visual elements-----------------
            // Grid
            const base_grid = grid(grid_spacing, line_features)
            chart_group.appendChild(base_grid)

            // Y-axis
            const y_axis = y_axis_text(y_axis_spacing, line_features, font_size)
            chart_group.appendChild(y_axis)
    
            // X-axis
            const x_axis = x_axis_text(x_axis_spacing, line_object, font_size)
            chart_group.appendChild(x_axis)
            
            // Trends
            const trend_collection = trends(trend_spacing, line_object, line_features, trend_styles)
            chart_group.appendChild(trend_collection)
            
            // Table
            const value_table = table(table_spacing, line_object, font_size)
            chart_group.appendChild(value_table)

            // Legend
            const trend_legend = legend(legend_spacing, line_object, font_size, trend_styles)
            chart_group.appendChild(trend_legend)

            return chart_group
        }


        //--Built graphs------------------------------
        function legend(spacing, object_data, font_size, styles){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            // Build content
            const r = rectangle(0, 0, spacing.width, spacing.height, 2, 'gray', 'white', .5, 3)
            group.appendChild(r)

            const left_padding = spacing.width/80

            for(let i in object_data){
                i = parseInt(i)

                const line_length = spacing.width/9

                const l = line(
                    left_padding, spacing.sep*(i+1),
                    left_padding + line_length, spacing.sep*(i+1), 
                    styles[i].color, styles[i].is_cont,
                    4
                )
                group.appendChild(l)

                const t = text(
                    (object_data[i].label).split('|')[1] + (i>0 ? ': '+(object_data[i].vals[0]).toFixed(1).toString()+' '+object_data[i].unit : ' ('+object_data[i].unit+')'), 
                    2*left_padding + line_length, spacing.sep*(i+1),
                    font_size*.95,
                    0,
                    'middle'

                )
                group.appendChild(t)
            }

            return group
        }

        function table(spacing, object_data, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            // Building header
            const dttm_col_name = text(
                'Fecha - Hora',
                spacing.snd_col_xpos, 0,
                font_size,
                0,
                'middle', 'middle'
            )
            group.appendChild(dttm_col_name)

            const val_col_name = text(
                'Valores', /// Change it with the name
                spacing.width, 0,
                font_size,
                0,
                'middle', 'end'
            )
            group.appendChild(val_col_name)

            // Selecting the first trend to use it as reference 
            const reference_trend = object_data[0]

            // Bulding table's content
            for(let i in reference_trend.dates){
                i = Number(i)
                const fst_col = text(
                    getMonthYearEs(reference_trend.dates[i]),
                    0, (i+1)*spacing.row_sep,
                    font_size,
                    0,
                    'middle'
                )
                group.appendChild(fst_col)

                const snd_col = text(
                    to24HourFormat(reference_trend.dates[i]),
                    spacing.snd_col_xpos, (i+1)*spacing.row_sep,
                    font_size,
                    0,
                    'middle', 'middle'
                )
                group.appendChild(snd_col)

                const trd_col = text(
                    (reference_trend.vals[i]).toFixed(2).toString(),
                    spacing.width, (i+1)*spacing.row_sep,
                    font_size,
                    0,
                    'middle', 'end'
                )
                group.appendChild(trd_col)
            }

            return group
        }
        
        function trends(spacing, object_data, data_info, styles){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            // Preparing convertion
            const value_to_pixel = data_value => spacing.net_height*(data_value - data_info.min_value)/(data_info.max_value - data_info.min_value) //(data_info.max_value - data_value)

            for(let j in object_data){
                if (j==0){
                    for(let i in object_data[j].vals){
                        const i_index = Number(i)
                        
                        const c = circle(i_index*spacing.x_sep, -value_to_pixel(object_data[j].vals[i_index]))
                        group.appendChild(c)
        
                        if(i_index < object_data[j].vals.length-1){
                            const l = line(
                                i_index*spacing.x_sep, -value_to_pixel(object_data[j].vals[i_index]),
                                (i_index+1)*spacing.x_sep, -value_to_pixel(object_data[j].vals[i_index+1]),
                                styles[j].color, styles[j].is_cont,
                                4
                            )
                            group.appendChild(l)
                        }
                    }
                }
                else{
                    const l = line(
                        0,  -value_to_pixel(object_data[j].vals[0]),
                        spacing.net_width, -value_to_pixel(object_data[j].vals[0]),
                        styles[j].color, styles[j].is_cont,
                        4
                    )
                    group.appendChild(l)  
                }
            }

            return group
        }

        function x_axis_text(spacing, object_data, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);
            
            // Selecting the first trend to use it as reference 
            const reference_trend = object_data[0]
            
            for(let i in reference_trend.dates){
                const new_date_slc = getMonthYearEs(reference_trend.dates[i])
                const t = text(
                    new_date_slc,
                    i*spacing.x_sep, 0,
                    font_size, -45
                )
                group.appendChild(t)
            }
            return group
        }

        function y_axis_text(spacing, data_info, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            const y_val_sep = (data_info.max_value - data_info.min_value)/(spacing.n_sep-1)

            for(let i=0; i < spacing.n_sep; i++){
                const t = text(
                    (data_info.max_value - i*y_val_sep).toFixed(2).toString(),
                    0, i*spacing.y_sep,
                    font_size,
                    0,
                    'middle'
                )
                group.appendChild(t)
            }

            return group
        }

        function grid(spacing, data_info){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            // Building border
            const r = rectangle(0, 0, spacing.width, spacing.height)
            group.appendChild(r)

            // Building vertical lines  (From left to right)
            for(let i=0; i < data_info.n_values; i++){ 
                const l = line(
                    spacing.horizontal_margin + i*spacing.x_sep, spacing.height,
                    spacing.horizontal_margin + i*spacing.x_sep, 0,
                    'gray'
                )
                group.appendChild(l)

                const l_ext = line(
                    spacing.horizontal_margin + i*spacing.x_sep, spacing.height,
                    spacing.horizontal_margin + i*spacing.x_sep, spacing.height*1.02
                )
                group.appendChild(l_ext)
            }

            // Building horizontal lines (From up to down)
            for(let i=0; i < spacing.n_h_lines; i++){
                const l = line( 
                    0, spacing.upper_margin + i*spacing.y_sep, 
                    spacing.width, spacing.upper_margin + i*spacing.y_sep,
                    'gray'
                )
                group.appendChild(l)

                const l_ext = line(
                    -spacing.width/107, spacing.upper_margin + i*spacing.y_sep,
                    0, spacing.upper_margin + i*spacing.y_sep
                )
                group.appendChild(l_ext)
            }

            return group
        }


        //--Fundamental graphs------------------------------
        
        // Generate line
        function line(x1, y1, x2, y2, color = 'black', cont = true, width = 2) {
            const l = document.createElementNS( "http://www.w3.org/2000/svg", "line" );
            l.setAttribute("x1", x1);
            l.setAttribute("y1", y1);
            l.setAttribute("x2", x2);
            l.setAttribute("y2", y2);
            l.setAttribute("stroke", color);
            l.setAttribute("stroke-width", width);
            if(!cont){
            l.setAttribute('stroke-dasharray', '5,5');
            }

            return l;
        }
 
        // Generate rectangle
        function rectangle(x1, y1, x2, y2, stroke_width = 2, stroke_color = 'black', fill_color = 'none', alpha = 1, corner_radius = 0){
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
            if (corner_radius > 0) {
                rec.setAttribute("rx", corner_radius);
                rec.setAttribute("ry", corner_radius);
            }


            return rec
        }

        // Generate text
        function text(txt, x, y, fontSize, rotation = 0, baseline = 'hanging', anchor = 'start') {
            // console.log('TEXT CALLED -> ', txt, ' | ', x, ' | ', y, ' | ', fontSize, ' | ', rotation)
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', x)
            t.setAttribute('y', y)
            t.setAttribute('text-anchor', anchor)
            t.setAttribute('dominant-baseline', baseline)
            t.setAttribute('font-size', fontSize)
            t.setAttribute('font-family', 'Sans-serif')
            t.setAttribute('fill', 'black')
            if(rotation && rotation!==0){
                t.setAttribute('transform', `rotate(${rotation}, ${x}, ${y})`)
            }
            t.textContent = txt
            return t
        }

        // Generate circle
        function circle(cx, cy, r = 8, strokeWidth = 1, fillColor = '#003087') {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', cx);
            c.setAttribute('cy', cy);
            c.setAttribute('r', r);
            c.setAttribute('stroke', fillColor);
            c.setAttribute('stroke-width', strokeWidth);
            c.setAttribute('fill', fillColor);
            return c;
        }
        
        //--------------------DATA FUNCTIONS--------------------\\
        function standardize_data (trace_data){
            const standardized_data = []
            const n_traces = trace_data.length

            let voltage
            if(n_traces > 5){
                voltage = parseInt(trace_data[5].Values[0].Value)
            }

            try{
                
                if(trace_data[0].Label !== undefined){
                    scope.saved_labels.length = 0
                    scope.saved_units.length = 0
                }
                
                for(let i in trace_data){
                    let current_trace

                    let available_label
                    let available_unit

                    if(trace_data[i].Label === undefined){
                        available_label = scope.saved_labels[i]

                        available_unit = scope.saved_units[i]
                    }
                    else{
                        available_label = trace_data[i].Label
                        scope.saved_labels.push(available_label)

                        available_unit = trace_data[i].Units
                        scope.saved_units.push(available_unit)
                    }

                    switch (i){
                        case '0':
                            current_trace = {
                                label: available_label,

                                unit: available_unit,
        
                                vals: clean_data(trace_data[i].Values)
                            }
                            break;
                        case '1':
                            current_trace = {
                                label: (scope.inputModified && n_traces<4) ? 'Modified nom line value' : available_label,
        
                                unit: available_unit,

                                vals: (scope.inputModified && n_traces<4) ? [scope.nominalValue] : clean_data(trace_data[i].Values)
                            }
                            break;
                        case '2':
                            current_trace = {
                                label: (scope.inputModified && n_traces<4) ? 'Modified nom line 80% value' : available_label,
        
                                unit: available_unit,
        
                                vals: (scope.inputModified && n_traces<4) ? [scope.nominalValue*.8] : clean_data(trace_data[i].Values)
                            }
                            break;
                        case '3':
                            current_trace = {
                                label: available_label, //X scope.inputModified ? 'Modified equip nom line value' : available_label,
        
                                unit: available_unit,
        
                                vals: !scope.inputModified ? clean_data(trace_data[i].Values) : [(10**6/1732)*(scope.nominalValue/voltage)]  // Add a PI TAG with the following formula cni = (cnp / (float(obj.tension) *1.732))*1000
                            }
                            break;
                        case '4':
                            current_trace = {
                                label: available_label, //X scope.inputModified ? 'Modified equip nom line 80% value' : available_label,
        
                                unit: available_unit,
        
                                vals: scope.inputModified ? [(10**6/1732)*(scope.nominalValue/voltage)*.8] : clean_data(trace_data[i].Values)
                            }
                            break;
                        default:
                            break;
                    }
                    
                    if(i<5){    // The first 5 lines are data and then, meta data
                        current_trace.dates = trace_data[i].Values
                                            .map(p => p.Time.toString())
    
                        standardized_data.push(current_trace)
                    }
                }
                console.log('--------------------------------------')
                standardized_data.filter(trace => trace.vals.length > 0)

                return standardized_data
            }
            catch(err){
                console.error('Error in standardize data', err)
            }
        }

        function get_trend_features(data_object){
            let n_values = 0
            let max_value = 0
            let min_value = 10**7
            for (const trace of data_object){

                const data = trace.vals

                const min_data_value = Math.min(...data)
                const max_data_value = Math.max(...data)

                // Get amount of values for x-axis
                n_values = Math.max(n_values, data.length)

                // Get max and min values in total
                max_value = Math.max(max_value, max_data_value)
                min_value = Math.min(min_value, min_data_value)
            } 

            return {
                'n_lines': data_object.length,
                'n_values': n_values,   /// Maybe it should be removed due it's redundant sometimes
                'max_value': max_value,
                'min_value': min_value
            }
        }

        //--------------------COMPLEMENTARY FUNCTIONS--------------------\\

        //-------Calculations-----\\             /// Pass here the value_to_pixel

        const clean_data = (data_array) => data_array.map(p => parseFloat(p.Value.replace(',', ''))).filter(v => !isNaN(v))

        /// PI VISION example -> 8/1/2025 7:37:12.003326 AM (String)   Month/Day/Year
        function getMonthYearEs(dateStr) {
            // Map of month numbers (1-based) to Spanish abbreviations
            const months = [
                'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
                'Jul.', 'Ago.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'
            ];

            // Parse the input string (assuming format like "8/31/2025 10:45 AM")
            const [month, , year] = dateStr.split(/[\/\s]/); // split by / or space
            const monthIndex = parseInt(month, 10) - 1;

            return `${months[monthIndex]} ${year}`
        }

        function to24HourFormat(str) {
            // Split date and time parts
            const [datePart, timePart, meridian] = str.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);

            if (meridian === 'PM' && hours !== 12) {
                hours += 12;
            } else if (meridian === 'AM' && hours === 12) {
                hours = 0;
            }

            const hoursStr = hours.toString().padStart(2, '0');
            return `${datePart} ${hoursStr}:${minutes.toString().padStart(2, '0')}`;
        }
        
    };
    PV.symbolCatalog.register(definition);
})(window.PIVisualization);