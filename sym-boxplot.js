(function (PV) {
    "use strict";

    function symbolVis() {}
    PV.deriveVisualizationFromBase(symbolVis);

    const definition = {
        typeName: "boxplot",
        displayName: "Boxplot",
        iconUrl: "Scripts/app/editor/symbols/ext/icons/boxplot.png",
        visObjectType: symbolVis,
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Single,
        getDefaultConfig: () => (
            {
                DataShape: "TimeSeries",
                Height: 150,
                Width: 400,
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
        const container = elem.find('#boxplot-container')[0];
        if (!container) return;

        this.onDataUpdate = function (data) {
            container.innerHTML = '';

            if (!data || !data.Data) return

            console.log("Raw data:", data)  //V
              
            // Data object should contain: median, Q1, Q3, IQR and an array of outliers
            /// console.log("Processed data:", data_object)  //V

            if (data_object.length === 0) return

            try {
                drawchart(container, data.Data)
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

            const boxplot_limits = get_boxplot_limits(trend_object)

            // Building main graphs
            const boxplot_chart = chart(trend_object, boxplot_limits, container_dimensions)
            svg.appendChild(boxplot_chart)

            container.appendChild(svg);
        }

        //--------------------BUILD GRAPHICS FUNCTIONS--------------------\\

        //-------GRAPHS-------\\

        //--Main graph------------------------------
        function chart(object, object_stops, total_space){   

            const chart_group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            //--Spacing and styling graphs----------------- // This area should be enought to make any changes in the graph
            const n_marks = 6
            
            const grid_spacing = {
                'x': 0,
                'y': 0,
                'width': total_space.width,
                'height': total_space.height*.432,
                'n_marks': n_marks
            }
            grid_spacing.horizontal_margin = grid_spacing.width*.011
            grid_spacing.vertical_margin = grid_spacing.height*.325
            grid_spacing.sep = grid_spacing.width/(grid_spacing.n_marks-1)
            grid_spacing.net_width = grid_spacing.width - 2*grid_spacing.horizontal_margin
            grid_spacing.net_height = grid_spacing.height - 2*grid_spacing.vertical_margin

            const boxplot_spacing = {
                'x': grid_spacing.horizontal_margin,
                'y': grid_spacing.vertical_margin,
                'width': grid_spacing.net_width,
                'height': grid_spacing.net_height
            }
            boxplot_spacing.whisker_height = boxplot_spacing.height*.6

            const x_axis_spacing = {
                'x': grid_spacing.horizontal_margin,
                'y': grid_spacing.height*1.055,
                'n_marks': n_marks,
                'sep': grid_spacing.sep
            }

            const feature_table_spacing = {
                'x': grid_spacing.width*.45,
                'y': grid_spacing.height*.674,
                'width': grid_spacing.width*.161,
                'height': grid_spacing.height*.326,
            }

            const font_size = grid_spacing.height*.045

            //--Graphing visual elements-----------------
            // Grid
            const base_grid = grid(grid_spacing)
            chart_group.appendChild(base_grid)

            // Boxplot
            const box_plot_content = box_plot(boxplot_spacing, object, object_stops)
            chart_group.appendChild(box_plot_content)

            // X-axis
            const x_axis = x_axis_text(x_axis_spacing, object_stops, font_size)
            chart_group.appendChild(x_axis)

            // Feature table 
            const feature_table_content = feature_table(feature_table_spacing)
            chart_group.appendChild(feature_table_content)

            return chart_group
        }

        function feature_table(spacing, boxplot_data, fontsize){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            const feature_nominations = ['Q1', 'Mediana', 'Q3', 'RIC', 'Inferior', 'Superior']    //TODO: Verify that boxplot_data has the same lenght and order as feature_nominations   // See if it's possible to avoid this array and use the boxplot_data's keys
            const y_sep = spacing.height/(boxplot_data.length-1)        

            for(let i in boxplot_data){
                const ypos = i*y_sep
                
                const t_nom = text(
                    feature_nominations[i],
                    0, ypos,
                    fontsize,
                    'end'
                )
                group.appendChild(t_nom)

                const t_val = text(
                    boxplot_data[i],    // TODO: adapt to the incoming data
                    spacing.width*.54, ypos,
                    fontsize,
                    'end'
                )
                group.appendChild(t_val)
            }
            
            return group
        }

        function x_axis_text(spacing, boxplot_stops, fontsize){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            const val_sep = (boxplot_stops.max-boxplot_stops.min)/(spacing.n_marks-1)

            for(let i=0; i < spacing.n_marks; i++){
                const t = text(
                    (boxplot_stops.min + i*val_sep).toFixed(1).toString(),
                    i*spacing.sep, 0,
                    fontsize
                )
                group.appendChild(t)
            }

            return group
        }

        function grid(spacing){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            const r = rectangle(
                0, 0,
                spacing.width, spacing.height
            )
            group.appendChild(r)

            for(let i=0; i < spacing.n_marks; i++){
                const l = line(
                    spacing.horizontal_margin + i*spacing.sep, spacing.height,
                    spacing.horizontal_margin + i*spacing.sep, spacing.height*1.025
                )
                group.appendChild(l)
            }

            return group
        }

        function box_plot(spacing, boxplot_data, boxplot_stops){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            const value_to_pixel = value => spacing.width*(value - boxplot_stops.min)/(boxplot_stops.max - boxplot_stops.min)

            // Building whiskers
            const upper_end = (spacing.height - spacing.whisker_height)/2
            const lower_end = spacing.height - upper_end

            const min_l = line(
                value_to_pixel(boxplot_data.min_limit), upper_end,
                value_to_pixel(boxplot_data.min_limit), lower_end
            )
            group.appendChild(min_l)

            const max_l = line(
                value_to_pixel(boxplot_data.max_limit), upper_end,
                value_to_pixel(boxplot_data.max_limit), lower_end
            )
            group.appendChild(max_l)

            const horizontal_l = line(
                value_to_pixel(boxplot_data.min_limit), spacing.height/2,
                value_to_pixel(boxplot_data.max_limit), spacing.height/2
            )
            group.appendChild(horizontal_l)

            // Building box
            const box = rectangle(
                value_to_pixel(boxplot_data.q1), 0,
                value_to_pixel(boxplot_data.q3), spacing.height,
                '#0099ff', '#e0ded8'
            )
            group.appendChild(box)

            const median_line = line(
                value_to_pixel(boxplot_data.median), 0,
                value_to_pixel(boxplot_data.median), spacing.height,
                '#fe5000'
            )
            group.appendChild(median_line)

            // Building outliers
            const all_outliers = boxplot_features.lower_outliers.concat(boxplot_features.upper_outliers)
            for(const outlier_pos of all_outliers){
                const outlier = rhombus(
                    value_to_pixel(outlier_pos), spacing.height/2,
                    spacing.whisker_height*.7
                )
                group.appendChild(outlier)
            }

            return group
        }

        function x_axis_text(spacing){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            return group
        }


        function feature_table(spacing){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

            // Move the entire group
            group.setAttribute("transform", `translate(${spacing.x}, ${spacing.y})`)

            return group
        }


        //--Fundamental graphs------------------------------

        //-------Calculations-----\\
        function get_boxplot_limits(boxplot_features){  /// If there are more features, use this functions to find them (change the name)
            const min = boxplot_features.lower_outliers.length ? Math.min(...boxplot_features.lower_outliers.length) : boxplot_features.min_limit
            const max = boxplot_features.upper_outliers.length ? Math.max(...boxplot_features.upper_outliers.length) : boxplot_features.max_limit

            return {
                'min': min,
                'max': max
            }
        }

        //-------Graphicals-----\\
        // Generate line
        function line(x1, y1, x2, y2, width = 2, color = 'black') {
            const l = document.createElementNS( "http://www.w3.org/2000/svg", "line" )
            l.setAttribute("x1", x1);
            l.setAttribute("y1", y1);
            l.setAttribute("x2", x2);
            l.setAttribute("y2", y2);
            l.setAttribute("stroke", color);
            l.setAttribute("stroke-width", width);

            return l;
        }

        // Generate rectangle
        function rectangle(x1, y1, x2, y2, fill_color = 'none', stroke_color = 'black'){
            const  r = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            r.setAttribute("x", x1)
            r.setAttribute("y", y1)
            r.setAttribute("width", x2 - x1)
            r.setAttribute("height", y2 - y1)
            r.setAttribute("fill", fill_color)
            r.setAttribute("stroke", stroke_color)

            return r
        }

        // Generate text
        function text(txt, x, y, fontSize, anchor = 'middle', baseline = 'hanging') {
            // console.log('TEXT CALLED -> ', txt, ' | ', x, ' | ', y, ' | ', fontSize, ' | ', rotation)
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            t.setAttribute('x', x)
            t.setAttribute('y', y)
            t.setAttribute('text-anchor', anchor)
            t.setAttribute('dominant-baseline', baseline)
            t.setAttribute('font-size', fontSize)
            t.setAttribute('font-family', 'Sans-serif')
            t.setAttribute('fill', 'black')
            t.textContent = txt
        
            return t
        }   

        // Generate rhombus
        function rhombus(xc, yc, height, color = 'black', stroke_width = 1){
            const r = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
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
    }

    PV.symbolCatalog.register(definition)
})(window.PIVisualization);
