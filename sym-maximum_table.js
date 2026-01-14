(function (PV) {
    "use strict";

    function symbolVis() {}
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: "maximum_table",
        displayName: "Maximum_table",
        iconUrl: "Scripts/app/editor/symbols/ext/icons/maximum_table.png",
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
        const container = elem.find('#maximum_table-container')[0];
        if (!container) return;

        this.onDataUpdate = function (data) {
            container.innerHTML = '';

            if (!data || !data.Data || !data.Data[0]) return;

            console.log("data:", data)

            let traces

            try{
                // Process each datasource into vals/dates arrays
                traces = data.Data.map(item => ({
                    label: item.Label,
                    vals: item.Values
                        .map(p => parseFloat(p.Value))
                        .filter(v => !isNaN(v)),
                    dates: item.Values
                        .map(p => p.Time.toString())
                })).filter(trace => trace.vals.length > 0);  // Skip empty traces
                
                if (traces.length === 0) return;

                console.log("traces:", traces)    
            }
            catch(err){
                console.error("Data conditioning error:", err);
            }
            
            try {
                drawchart(container, traces, scope.nominalValue);
                //drawchart(container, vals, dates, scope.nominalValue, scope.windowSize);
            } catch (err) {
                console.error("Chart rendering error:", err);
            }

        };

        //--------------------PRINCIPAL FUNCTIONS--------------------\\
        
        //--------Drawing--------\\
        function drawchart(container, traces){ /// Update with the nominal value only if it's called "nominal..."  (No more nominal as parameter)

            container.innerHTML = "";

            const container_width = container.offsetWidth;
            const container_height = container.offsetHeight;

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", container_width);
            svg.setAttribute("height", container_height);

            const tbl_top_y = container_height*.05
            const tbl_top_left_x = container_width*.06

            const data = traces[0].vals
            const dates = traces[0].dates

            // console.log('data: ', data)
            // console.log('dates: ', dates)

            const maxims_of_months = { 
                "values": data,
                "dates": dates};

            const elements_portion_height = .9

            const chart_height = container_height*elements_portion_height

            const smrz_width  = container_width
            const smrz_height  = chart_height

            const smrz_character_size = smrz_width/24

            const smrz_top_y = tbl_top_y
            //const smrz_top_left_x = 520
            const smrz_top_left_x = container_width - smrz_width

            // Generate Summary table
            const summary_right_table = summary_table(smrz_top_left_x, smrz_top_y, smrz_height, smrz_width, maxims_of_months, smrz_character_size)
            svg.appendChild(summary_right_table)

            container.appendChild(svg);
        };

        //--------------------BUILD GRAPHICS FUNCTIONS--------------------\\

        //-------Calculations-----\\
        

        //-------GRAPHS-------\\
        function summary_table(x, y, smrz_height, smrz_width, maxims_of_months, smrz_character_size){
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            group.setAttribute("transform", `translate(${x}, ${y})`)

            const first_column_pos = smrz_width*.1
            const second_column_pos = smrz_width*.45
            const third_column_pos = smrz_width*.8
            
            const vertical_margin = smrz_height/15

            //X smrz_height*.2
            const vert_sep = (smrz_height-vertical_margin)/maxims_of_months.dates.length        

            const datetime_title = text('Fecha - Hora', second_column_pos, vertical_margin, smrz_character_size)
            group.appendChild(datetime_title)

            const power_title = text('Máx.', third_column_pos, vertical_margin, smrz_character_size)  /// It should be dynamic depending the measure involved
            group.appendChild(power_title)

            for(let i in maxims_of_months.dates){
                const index = Number(i)
                const new_sep = vert_sep*(index+1) + vertical_margin

                const record_date1 = text(getMonthYearEs(maxims_of_months.dates[index]), first_column_pos, new_sep, smrz_character_size)
                group.appendChild(record_date1)
                
                const record_date2 = text(to24HourFormat(maxims_of_months.dates[index]), second_column_pos, new_sep, smrz_character_size)
                group.appendChild(record_date2)
                
                const record_value = text((maxims_of_months.values[index]).toFixed(2).toString(), third_column_pos, new_sep, smrz_character_size)
                group.appendChild(record_value)
            }

            return group

            }

        //--------------------FUNDAMENTAL FUNCTIONS--------------------\\

        //-------Calculations-----\\

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

        //-------GRAPHS-----\\

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
    };
    PV.symbolCatalog.register(definition);
})(window.PIVisualization);