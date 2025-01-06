const btn_create = document.getElementById('btn_create');
const btn_DrawBoard = document.getElementById('btn_DrawBoard');
const btn_Hill_climbing = document.getElementById('btn_Hill_climbing');
const btn_genetic = document.getElementById('btn_genetic');
const btn_csp_ltr = document.getElementById('btn_csp_ltr');
const btn_csp_ttb = document.getElementById('btn_csp_ttb');
const btn_csp_center = document.getElementById('btn_csp_center');
const Initial = document.getElementById('initial');
const Final = document.getElementById('final');

var placeQueens = [];
var size = 20;
var draw_delay = false;
var delay_time = 100;
var populationSize = 100;
var generations = 1000;
var mutation = 0.05;


var count_CSP_ltr = 0;
var count_CSP_ttb = 0;
var count_CSP_center = 0;

function drawBoard() {
    size = parseInt(document.getElementById('size').value);
    draw_delay = document.getElementById('draw_delay').checked;
    delay_time = parseInt(document.getElementById('delay_time').value);
    const boardContainer = document.getElementById('board-container');

    boardContainer.innerHTML = '';
    Initial.innerHTML = '';
    Final.innerHTML = '';

    const table = document.createElement('table');

    for (let row = 0; row < size; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < size; col++) {
            const td = document.createElement('td');
            const isBlack = (row + col) % 2 === 1;
            td.className = isBlack ? 'black' : 'white';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    boardContainer.appendChild(table);
}

function placeQueensRandomly(size) {
    placeQueens = [];
    Final.innerHTML = "";
    const table = document.querySelector('table');

    const cells = Array.from(table.getElementsByClassName('queen'));
    for (let cell of cells) {
        cell.innerHTML = '';
        cell.classList.remove('queen');
    }

    for (let i = 0; i < size; i++) {
        var j = Math.floor(Math.random() * size);
        const queenCell = table.rows[j].cells[i];
        queenCell.innerHTML = '♛';
        queenCell.classList.add('queen');
        placeQueens.push(j);
    }

    Initial.innerHTML = "تعداد تهدید در حالت اولیه : " + heuristic(placeQueens);
}

function heuristic(placeQueens) {
    let num = 0;
    for (let i = 0; i < size - 1; i++) {
        for (let j = i + 1; j < size; j++) {
            if (placeQueens[i] === placeQueens[j] || Math.abs(i - j) === Math.abs(placeQueens[i] - placeQueens[j])) {
                num++;
            }
        }
    }
    return num;
}

async function hill_climbing() {
    const currentQueens = [...placeQueens];
    let currentConflict = heuristic(currentQueens);
    let improved = true;

    while (improved && currentConflict > 0) {
        improved = false;

        for (let col = 0; col < size; col++) {
            let originalRow = currentQueens[col];

            for (let row = 0; row < size; row++) {
                if (row !== originalRow) {
                    currentQueens[col] = row;

                    let newConflict = heuristic(currentQueens);
                    if (newConflict < currentConflict) {
                        currentConflict = newConflict;
                        improved = true;
                        await drawQueensDelayed(currentQueens);
                    } else {
                        currentQueens[col] = originalRow;
                    }
                }
            }
        }
    }

    Final.innerHTML = "تعداد تهدید در تپه نوردی : " + currentConflict;
}

async function genetic() {
    Initial.innerHTML = '';
    populationSize = parseInt(document.getElementById('populationSize').value);
    generations = parseInt(document.getElementById('generations').value);
    mutation = parseFloat(document.getElementById('mutation').value);

    let population = initializePopulation(populationSize, size);

    for (let iteration = 0; iteration < generations; iteration++) {
        population.sort((a, b) => heuristic(a) - heuristic(b));
        let newPopulation = population.slice(0, 2);

        while (newPopulation.length < populationSize) {
            let parent1 = selectParent(population);
            let parent2 = selectParent(population);
            let child = crossover(parent1, parent2);

            // if (delay_time) {
            //     await drawQueensDelayed(child);
            // }

            if (Math.random() < mutation) {
                child = mutate(child, size);
            }

            newPopulation.push(child);
        }

        population = newPopulation;



        if (population.some(ind => heuristic(ind) === 0)) {
            const solution = population.find(ind => heuristic(ind) === 0);
            await drawQueensDelayed(solution);
            Final.innerHTML = "تعداد تهدید در ژنتیک : 0";
            return;
        }
    }


    const bestSolution = minimizeConflicts(population);
    await drawQueensDelayed(bestSolution);
    Final.innerHTML = "تعداد تهدید در ژنتیک : " + heuristic(bestSolution);
}

function initializePopulation(populationSize, size) {
    return Array.from({ length: populationSize }, () =>
        Array.from({ length: size }, () => Math.floor(Math.random() * size))
    );
}

function crossover(parent1, parent2) {
    const crossoverPoint = Math.floor(Math.random() * (parent1.length - 1)) + 1;
    let child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    return duplicateQueens(child);
}

function mutate(state, size) {
    const col = Math.floor(Math.random() * size);
    const row = Math.floor(Math.random() * size);
    let mutatedState = [...state];
    mutatedState[col] = row;
    return duplicateQueens(mutatedState);
}

function duplicateQueens(state) {
    const seen = new Set();
    for (let col = 0; col < state.length; col++) {
        let row = state[col];
        while (seen.has(row)) {
            row = Math.floor(Math.random() * state.length);
        }
        seen.add(row);
        state[col] = row;
    }
    return state;
}

function selectParent(population) {
    return population[Math.floor(Math.random() * population.length)];
}

function minimizeConflicts(population) {
    return population.reduce((best, ind) =>
        (heuristic(ind) < heuristic(best) ? ind : best), population[0]);
}

function CSP_ltr() {
    Initial.innerHTML = '';

    const queens = new Array(size).fill(-1);

    backtrack_ltr(queens, 0).then(() => {
        const conflicts = heuristic(queens);
        console.log("count_CSP_ltr : ", number_to_string(count_CSP_ltr));
        count_CSP_ltr = 0;

        if (conflicts === 0) {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : 0";
        } else {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : " + conflicts;
        }
    });
}

async function backtrack_ltr(queens, col) {
    if (col === size) {
        await drawQueensDelayed(queens);
        return true;
    }

    for (let row = 0; row < size; row++) {
        count_CSP_ltr++;
        if (isSafe(queens, row, col)) {
            queens[col] = row;
            await drawQueensDelayed(queens);
            if (await backtrack_ltr(queens, col + 1)) {
                return true;
            }
            queens[col] = -1;
        }
    }
    return false;
}

function CSP_ttb() {
    Initial.innerHTML = '';

    const queens = new Array(size).fill(-1);
    const startCol = Math.floor(size / 2);

    backtrack_ttb(queens, startCol, 1).then(() => {
        const conflicts = heuristic(queens);
        console.log("count_CSP_ttb : ", number_to_string(count_CSP_ttb));
        count_CSP_ttb = 0;

        if (conflicts === 0) {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : 0";
        } else {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : " + conflicts;
        }
    });
}

async function backtrack_ttb(queens, col, step) {
    if (col === size || col < 0) {
        await drawQueensDelayed(queens);
        return true;
    }

    for (let row = 0; row < size; row++) {
        count_CSP_ttb++;
        if (isSafe(queens, row, col)) {
            queens[col] = row;
            await drawQueensDelayed(queens);

            let nextCol;
            if (step % 2 !== 1) {
                nextCol = col + step;
            } else {
                nextCol = col - step;
            }

            if (await backtrack_ttb(queens, nextCol, step + 1)) {
                return true;
            }


            queens[col] = -1;
        }
    }
    return false;
}

function CSP_center() {
    Initial.innerHTML = '';

    const queens = new Array(size).fill(-1);
    const startCol = Math.floor(size / 2);

    backtrack_center(queens, startCol, 1).then(() => {
        const conflicts = heuristic(queens);
        console.log("count_CSP_center : ", number_to_string(count_CSP_center));
        count_CSP_center = 0;


        if (conflicts === 0) {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : 0";
        } else {
            Final.innerHTML = "تعداد تهدید در ارضای محدودیت : " + conflicts;
        }
    });
}

async function backtrack_center(queens, col, step) {
    if (col === size || col < 0) {
        await drawQueensDelayed(queens);
        return true;
    }

    const startRow = Math.floor(size / 2);

    for (let row = startRow; row < size; row++) {
        count_CSP_center++;
        if (isSafe(queens, row, col)) {
            queens[col] = row;
            await drawQueensDelayed(queens);

            let nextCol;
            if (step % 2 !== 1) {
                nextCol = col + step;
            } else {
                nextCol = col - step;
            }

            if (await backtrack_center(queens, nextCol, step + 1)) {
                return true;
            }

            queens[col] = -1;
        }
    }

    for (let row = 0; row < startRow; row++) {
        count_CSP_center++;
        if (isSafe(queens, row, col)) {
            queens[col] = row;
            await drawQueensDelayed(queens);

            let nextCol;
            if (step % 2 !== 1) {
                nextCol = col + step;
            } else {
                nextCol = col - step;
            }

            if (await backtrack_center(queens, nextCol, step + 1)) {
                return true;
            }

            queens[col] = -1;
        }
    }

    return false;
}

function isSafe(queens, row, col) {
    for (let i = 0; i < size; i++) {
        if (queens[i] !== -1) {
            if (queens[i] === row || Math.abs(i - col) === Math.abs(queens[i] - row)) {
                return false;
            }
        }
    }

    return true;
}

function drawQueensDelayed(queens) {
    if (draw_delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                drawQueens(queens);
                resolve();
            }, delay_time);
        });
    } else {

        drawQueens(queens)
    }
}

function drawQueens(queens) {
    const table = document.querySelector('table');

    const cells = Array.from(table.getElementsByClassName('queen'));
    for (let cell of cells) {
        cell.innerHTML = '';
        cell.classList.remove('queen');
    }

    for (let col = 0; col < size; col++) {
        const queenRow = queens[col];
        if (queenRow >= 0 && queenRow < size) {
            const queenCell = table.rows[queenRow].cells[col];
            queenCell.innerHTML = '♛';
            queenCell.classList.add('queen');
        }
    }
}

function number_to_string(number) {
    let numberStr = number.toString();

    let formattedNumber = numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return formattedNumber;
}

btn_create.addEventListener('click', () => drawBoard());
btn_DrawBoard.addEventListener('click', () => placeQueensRandomly(size));
btn_Hill_climbing.addEventListener('click', () => hill_climbing());
btn_genetic.addEventListener('click', () => genetic());
btn_csp_ltr.addEventListener('click', () => CSP_ltr());
btn_csp_ttb.addEventListener('click', () => CSP_ttb());
btn_csp_center.addEventListener('click', () => CSP_center());
