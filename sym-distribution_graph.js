(function (PV) {
    "use strict";

    function symbolVis() {}
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: "distribution_graph",
        displayName: "Distribution_graph",
        iconUrl: "Scripts/app/editor/symbols/ext/icons/distribution_graph.png",
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
        const container = elem.find('#distribution_graph-container')[0];
        if (!container) return;

        //--------------------ON UPDATE--------------------\\
        this.onDataUpdate = function (data) {
            container.innerHTML = '';
            if (!data || !data.Data) return

            console.log("Raw data:", data)  //V
            
            const data_object = data.Data   //TODO: add here <- const data_object = standardize_data(data.Data)

            // console.log("data processed:", data_object)  //V

            try {
                drawchart(container, data_object)
            }
            catch(err){
                console.error("Chart rendering error", err)
            }

        }

        //--------------------PRINCIPAL FUNCTIONS--------------------\\

        //--------Calculations--------\\

        

        //--------Drawing--------\\
        function drawchart(container, object){ 
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
            const distribution_chart = chart(object, container_dimensions)
            svg.appendChild(distribution_chart)

            container.appendChild(svg);
        }

        //--------------------BUILT GRAPHICS FUNCTIONS--------------------\\

        //-------GRAPHS-------\\
        
        //--Main graph------------------------------
        function chart(object_data, total_space){

            const chart_group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            const general_features = get_general_features(object_data)

            //--Spacing and styling graphs----------------- // This area should be enought to make any changes in the graph
            const grid_spacing = {  
                'x': total_space.width*.058,
                'y': 0,
                'n_h_lines': 8,     /// Improve this 8 (make it dynamic, no static)
                'width': total_space.width*.633,
                'height': total_space.height*.81
            }
            grid_spacing.horizontal_margin = general_features.n_values>1 ? grid_spacing.width*.047 : grid_spacing.width/2
            grid_spacing.upper_margin = 0 // grid_spacing.height*.35
            grid_spacing.lower_margin = grid_spacing.height*.049
            grid_spacing.net_width = grid_spacing.width - 2*grid_spacing.horizontal_margin
            grid_spacing.net_height = grid_spacing.height - (grid_spacing.upper_margin + grid_spacing.lower_margin)
            grid_spacing.x_sep = general_features.n_values>1 ? grid_spacing.net_width/(general_features.n_values-1) : 0
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

            const feature_area_spacing = {
                'x': grid_spacing.x + grid_spacing.width*.305,
                'y': total_space.height*.864,
                'h_sep': total_space.width*.047
            }

            const font_size = grid_spacing.height*.045

            //--Graphing visual elements-----------------
            // Grid
            const base_grid = grid(grid_spacing, general_features)
            chart_group.appendChild(base_grid)

            // Y-axis
            const y_axis = y_axis_text(y_axis_spacing, general_features, font_size)
            chart_group.appendChild(y_axis)

            // X-axis
            const x_axis = x_axis_text(x_axis_spacing, object_data, general_features, font_size)
            chart_group.appendChild(x_axis)

            // Feature area
            const feature_area = feature_area_box(x_axis_spacing, object_data, font_size)
            chart_group.appendChild(feature_area)

            return chart_group
        }

        //--Built graphs------------------------------
        function feature_area_box(spacing, object_data, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            for(const [feature_name, feature_value] of Object.entries(object_data)){
                // Continue here
            }
        }
        
        function x_axis_text(spacing, object_data, data_info, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)
            
            // Selecting the first trend to use it as reference 
            const reference_trend = object_data[1]
            
            for(let i in reference_trend.vals){
                const t = text(
                    (object_data.min_val + i*data_info.bind_size).toFixed(1).toString(),
                    i*spacing.x_sep, 0,
                    font_size, -90
                )
                group.appendChild(t)
            }
            return group
        }

        function y_axis_text(spacing, data_info, font_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`);

            const y_val_sep = (data_info.max_value - data_info.min_percentage)/(spacing.n_sep-1)

            for(let i=0; i < spacing.n_sep; i++){
                const t = text(
                    (100*(data_info.max_value - i*y_val_sep)).toFixed(2).toString() + '%',  /// Confirm here the 
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

        //--------------------DATA FUNCTIONS--------------------\\

        // function standardize_data (trace_data){
        //      return an object with: percentages (0...1 for the y-axis), min_val, max_val (Both for the x-axis) and the other features required in the feature area
        // }

        function get_general_features(data_object){
            let n_values
            let max_percentage = 0
            let min_percentage = 0
            for (let i in data_object){

                const data = data_object[i].vals

                const max_data_value = Math.max(...data)

                // Get amount of values for x-axis
                if(i==0){   // The first element should be the histogram     // |X -> Maybe here is i=="0" 
                    n_values = data_object[i].vals.length + 1
                }

                // Get max and min values in total
                max_percentage = Math.max(max_percentage, max_data_value)
            } 
            let bind_size = (data_object.max_val - data_object.min_val)/(n_values)

            return {
                'n_lines': data_object.length,
                'n_values': n_values,   /// Maybe it should be removed due it's redundant sometimes
                'max_percentage': max_percentage,
                'min_percentage': min_percentage,
                'bind_size': bind_size
            }
        }

        //--------------------FUNDAMENTAL FUNCTIONS--------------------\\

        // Generate line
        function line(x1, y1, x2, y2, color, width = 1) {
            const l = document.createElementNS( "http://www.w3.org/2000/svg", "line" )
            l.setAttribute("x1", x1)
            l.setAttribute("y1", y1)
            l.setAttribute("x2", x2)
            l.setAttribute("y2", y2)
            l.setAttribute("stroke", color)
            l.setAttribute("stroke-width", width)

            return l
        }

        // Generate triangle
        function triangle(xc, yc, height, color = 'black', stroke_width = 1) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
            const side_length = height*2/Math.sqrt(3)
            const points = `${xc - side_length/2},${yc + side_length/(2*Math.sqrt(3))} 
                            ${xc + side_length/2},${yc + side_length/(2*Math.sqrt(3))} 
                            ${xc},${yc - side_length/(Math.sqrt(3))}`
            t.setAttribute("points", points)
            t.setAttribute("fill", color)
            t.setAttribute("stroke", color)
            t.setAttribute("stroke-width", stroke_width)
            return t
        }

        // Generate rhombus
        function rhombus(xc, yc, height, color = 'black', stroke_width = 1){
            const r = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const side_length = height/Math.sqrt(3)
            const points = `${xc},${yc - side_length*Math.sqrt(3)/2}
                            ${xc - side_length/2},${yc}
                            ${xc},${yc + side_length*Math.sqrt(3)/2}
                            ${xc + side_length/2},${yc}`
            r.setAttribute("points", points)
            r.setAttribute("fill", color)
            r.setAttribute("stroke", color)
            r.setAttribute("stroke-width", stroke_width)
            return r
        }

        // Generate rectangle
        function rectangle(x1, y1, x2, y2, stroke_width = 1, stroke_color = 'gray', alpha = 1, fill_color = 'none'){
            const  rec = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            
            rec.setAttribute("x", x1)
            rec.setAttribute("y", y1)
            rec.setAttribute("width", x2 - x1)
            rec.setAttribute("height", y2 - y1)
            rec.setAttribute("fill", fill_color)
            rec.setAttribute("fill-opacity", alpha)
            rec.setAttribute("stroke", stroke_color)
            rec.setAttribute("stroke-width", stroke_width)
            rec.setAttribute("stroke-opacity", alpha)

            return rec
        }

        // Generate text
        function text(txt, x, y, fontSize, rotation = 0, baseline = 'hanging', anchor = 'start') {
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
    }
    PV.symbolCatalog.register(definition);
})(window.PIVisualization);