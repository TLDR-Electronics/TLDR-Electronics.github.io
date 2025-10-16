const multiplier = [0.1, 1.0, 10.0, 100.0, 1.0e3, 10.0e3, 100.0e3, 1.0e6, 10.0e6]

const e_series = [
            /*e3*/[0.0, Number.POSITIVE_INFINITY, 1.0, 2.2, 4.7],
            /*e6*/[0.0, Number.POSITIVE_INFINITY, 1.0, 1.5, 2.2, 3.3, 4.7, 6.8],
            /*e12*/[0.0, Number.POSITIVE_INFINITY, 1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
            /*e24*/[0.0, Number.POSITIVE_INFINITY, 1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
            /*e48*/[0.0, Number.POSITIVE_INFINITY, 1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40, 1.47, 1.54, 1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49, 2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02, 4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.90, 6.19, 6.49, 6.81, 7.15, 7.50, 7.87, 8.25, 8.66, 9.09, 9.53],
            /*e96*/[0.0, Number.POSITIVE_INFINITY, 1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12, 4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76]
]

function collectValues() {
    var values = [];
    var selected_series = parseInt(document.getElementById('resistor_series').value);

    // Generate All Resistor Values
    for (const i of multiplier) {
        for (const j of e_series[selected_series]) {
            values.push(i * j);
        }
    }

    return [...new Set(values)];
}

function update_image() {
    var image = document.getElementById('resistor_image');
    const r3_zero = document.getElementById('zeroR3').checked;
    const r1_open = document.getElementById('infR1').checked;
    const alt_config = document.getElementById('alt_config').checked ? '_alt' : '';

    if (r3_zero && r1_open) {
        image.src = `/calcs/combination_resistor_solver/images/r2_only${alt_config}.svg`
    }
    if (r3_zero && !r1_open) {
        image.src = `/calcs/combination_resistor_solver/images/no_r3${alt_config}.svg`
    }
    if (!r3_zero && !r1_open) {
        image.src = `/calcs/combination_resistor_solver/images/all${alt_config}.svg`
    }
    if (!r3_zero && r1_open) {
        image.src = `/calcs/combination_resistor_solver/images/no_r1${alt_config}.svg`
    }
}

function calculate() {
    var container = document.getElementById('results');
    container.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    setTimeout(findClosestCombinations, 100);
}

function findClosestCombinations() {
    //var startTime = performance.now()
    const target_resistance = parseFloat(document.getElementById('target_resistance').value);
    const force_r3_zero = document.getElementById('zeroR3').checked;
    const force_r1_open = document.getElementById('infR1').checked;
    const valuesList = collectValues();
    const alt_config = document.getElementById('alt_config').checked;

    const results = [];
    //var count = 0;
    var skip = false;
    var computed_resistance = 0;

    valuesList.forEach((R1, i) => {
        // Start the loop for R2 from 'i' instead of '0' to avoid duplicating pairs
        // This ensures R1 <= R2, including cases where R1 == R2
        for (let j = i; j < valuesList.length; j++) {
            const R2 = valuesList[j];
            valuesList.forEach(R3 => {
                skip = false;

                // Various methods to reduce the amount of calculations:

                if ((!force_r1_open || R1 > 1e99) &&    // Handles the R1 open checkbox
                    (!force_r3_zero || R3 == 0)        // Handles the R3 closed checkbox
                ) {

                    if (alt_config) {
                        computed_resistance = 1 / (1 / R1 + 1 / (R2 + R3));
                    } else {
                        computed_resistance = 1 / (1 / R1 + 1 / R2) + R3;
                    }
                    const diff = target_resistance - computed_resistance;
                    const abs_diff = Math.abs(diff);

                    // If the target resistance is 10% out of range don't calculate

                    if (abs_diff < (target_resistance * 0.1)) {
                        const diff_percent = 100 * ((computed_resistance - target_resistance) / target_resistance);
                        results.push({ R1, R2, R3, abs_diff, diff, computed_resistance, diff_percent });
                        //count += 1;
                    }
                }
            });
        }
    });

    // Sort results by difference and take the 50 closest
    const closest = results.sort((a, b) => a.abs_diff - b.abs_diff).slice(0, 50);

    displayResults(closest);
    update_image();
    //console.log(count)
    //const endTime = performance.now()
    //console.log(`Calculations took ${endTime - startTime} milliseconds`)
}

function displayResults(closest) {
    // Convert the 'closest' array of objects to a 2D array
    const tableData = closest.map(item => [parseFloat(item.R1.toFixed(4)),
    parseFloat(item.R2.toFixed(4)),
    parseFloat(item.R3.toFixed(4)),
    parseFloat(item.computed_resistance.toFixed(4)),
    parseFloat(item.diff_percent.toFixed(4))]);

    // Optionally, add a header row
    tableData.unshift(['R1', 'R2', 'R3', 'Result', 'Difference (%)']);

    // Use the existing 'createTable' function to generate the table
    createTable(tableData);
}

function createTable(tableData) {
    var table = document.createElement('table');
    var tableHead = document.createElement('thead');
    var tableBody = document.createElement('tbody');
    var container = document.getElementById('results');

    // Bootstrap table classes for striped table
    table.className = "table table-striped table-hover";
    container.innerHTML = '';

    tableData.forEach(function (rowData, index) {
        var row = document.createElement('tr');
        rowData.forEach(function (cellData) {
            var cell;
            if (index === 0) { // This checks if it's the header row
                cell = document.createElement('th');
                cell.scope = "col"; // Bootstrap accessibility improvement
            } else {
                cell = document.createElement('td');
            }
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });
        if (index === 0) {
            tableHead.appendChild(row); // Append the first row to the <thead>
        } else {
            tableBody.appendChild(row); // Append subsequent rows to the <tbody>
        }
    });

    // Append the <thead> and <tbody> to the table
    table.appendChild(tableHead);
    table.appendChild(tableBody);

    container.appendChild(table);
}
