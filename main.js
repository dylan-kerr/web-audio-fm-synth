/*
ISC License

Copyright (c) 2020, Dylan Kerr.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

let audioContext;
const duration = 3;
const maxFrequency = Math.log10(10000);
let operatorCount = 1;
let operatorFrequency;
let operatorVolume;
let transferGain;

function onStart() {
    if (audioContext) {
        audioContext.close();
    }
    audioContext = new AudioContext();

    const operators = [...Array(operatorCount)].map((_, index) => {
        const operator = audioContext.createOscillator();
        operator.frequency.value = operatorFrequency[index];
        operator.start();
        operator.stop(audioContext.currentTime + duration);

        if (operatorVolume[index] > 0) {
            const gainNode = audioContext.createGain();
            gainNode.gain.value = operatorVolume[index] / 100;
            operator.connect(gainNode).connect(audioContext.destination);
        }

        return operator;
    });

    transferGain.forEach((transfersForSource, sourceIndex) => {
        transfersForSource.forEach((transfer, sinkIndex) => {
            // Disallow self-feedback, and skip zero values.
            if (sourceIndex === sinkIndex || transfer === 0) {
                return;
            }
            const gainNode = audioContext.createGain();
            gainNode.gain.value = transfer;
            operators[sourceIndex].connect(gainNode).connect(operators[sinkIndex].frequency);
        });
    });
}

function randomise() {
    [...Array(operatorCount)].forEach((_, sourceIndex) => {
        operatorFrequency[sourceIndex] = Math.round(10 ** (Math.random() * maxFrequency));
        operatorVolume[sourceIndex] = Math.random() > 1 / Math.sqrt(operatorCount)
            ? 0
            : Math.round(Math.random() * 100);
        [...Array(operatorCount)].forEach((_, sinkIndex) => {
            // Disallow self-feedback.
            if (sourceIndex === sinkIndex) {
                return;
            }
            transferGain[sourceIndex][sinkIndex] = Math.random() > 1 / Math.sqrt(operatorCount)
                ? 0
                : Math.round(10 ** (Math.random() * maxFrequency));
        });
    });
    buildUI();
}

function buildTableHeader() {
    const thead = document.createElement('thead');
    thead.style.borderBottom = '2px solid black';

    const row1 = document.createElement('tr');

    row1.appendChild(document.createElement('td'));

    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 2;
    row1.appendChild(emptyCell);

    const opRowHeader = document.createElement('td');
    opRowHeader.style.borderLeft = '1px solid black';
    opRowHeader.style.borderBottom = '1px solid black';
    opRowHeader.style.textAlign = 'right';
    opRowHeader.textContent = 'Op';
    row1.appendChild(opRowHeader);

    const row2 = document.createElement('tr');

    const opColHeader = document.createElement('td');
    opColHeader.style.textAlign = 'center';
    opColHeader.textContent = 'Op';
    row2.appendChild(opColHeader);

    const frequencyColHeader = document.createElement('td');
    frequencyColHeader.colSpan = 2;
    frequencyColHeader.style.borderLeft = '1px solid black';
    frequencyColHeader.style.textAlign = 'center';
    frequencyColHeader.textContent = 'Frequency';
    row2.appendChild(frequencyColHeader);

    const volumeRowHeader = document.createElement('td');
    volumeRowHeader.style.borderLeft = '1px solid black';
    volumeRowHeader.style.textAlign = 'right';
    volumeRowHeader.textContent = 'Volume';
    row2.appendChild(volumeRowHeader);

    [...Array(operatorCount)].forEach((_, opIndex) => {
        const opHeader = document.createElement('td');
        opHeader.colSpan = 2;
        opHeader.style.borderLeft = '1px solid black';
        opHeader.style.borderBottom = '1px solid black';
        opHeader.style.textAlign = 'center';
        opHeader.textContent = opIndex + 1;
        row1.appendChild(opHeader);

        const volumeInput = document.createElement('input');
        volumeInput.type = 'range';
        volumeInput.min = 0;
        volumeInput.max = 100;
        volumeInput.step = 1;
        volumeInput.value = operatorVolume[opIndex];
        const volumeInputCell = document.createElement('td');
        volumeInputCell.style.borderLeft = '1px solid black';
        volumeInputCell.appendChild(volumeInput);
        row2.appendChild(volumeInputCell);

        const volumeDisplayCell = document.createElement('td');
        volumeDisplayCell.style.textAlign = 'right';
        volumeDisplayCell.textContent = operatorVolume[opIndex] + '%';
        row2.appendChild(volumeDisplayCell);

        volumeInput.addEventListener('input', event => {
            const value = Math.round(Number(event.target.value));
            volumeDisplayCell.textContent = value + '%';
            operatorVolume[opIndex] = value;
        });
    });

    thead.appendChild(row1);
    thead.appendChild(row2);
    return thead;
}

function buildTableRow(sourceIndex) {
    const row = document.createElement('tr');
    row.style.borderTop = '1px solid black';

    const operatorCell = document.createElement('td');
    operatorCell.style.textAlign = 'center';
    operatorCell.textContent = sourceIndex + 1;
    row.appendChild(operatorCell);

    const frequencyInput = document.createElement('input');
    frequencyInput.type = 'range';
    frequencyInput.min = 0;
    frequencyInput.max = maxFrequency;
    frequencyInput.step = 0.01;
    frequencyInput.value = Math.log10(operatorFrequency[sourceIndex]);
    const frequencyInputCell = document.createElement('td');
    frequencyInputCell.style.borderLeft = '1px solid black';
    frequencyInputCell.appendChild(frequencyInput);
    row.appendChild(frequencyInputCell);

    const frequencyDisplayCell = document.createElement('td');
    frequencyDisplayCell.style.borderRight = '1px solid black';
    frequencyDisplayCell.style.textAlign = 'right';
    frequencyDisplayCell.textContent = operatorFrequency[sourceIndex] + ' Hz';
    row.appendChild(frequencyDisplayCell);

    frequencyInput.addEventListener('input', event => {
        const value = Math.round(10 ** Number(event.target.value));
        frequencyDisplayCell.textContent = value + ' Hz';
        operatorFrequency[sourceIndex] = value;
    });

    row.appendChild(document.createElement('td'));

    [...Array(operatorCount)].forEach((_, sinkIndex) => {
        // Disallow self-feedback.
        if (sourceIndex === sinkIndex) {
            const emptyCell = document.createElement('td');
            emptyCell.style.borderLeft = '1px solid black';
            row.appendChild(emptyCell);
            row.appendChild(document.createElement('td'));
            return;
        }
        const transfer = transferGain[sourceIndex][sinkIndex];

        const transferInput = document.createElement('input');
        transferInput.type = 'range';
        transferInput.min = 0;
        transferInput.max = maxFrequency;
        transferInput.step = 0.01;
        transferInput.value = transfer <= 0 ? 0 : Math.log10(transfer);
        const transferInputCell = document.createElement('td');
        transferInputCell.style.borderLeft = '1px solid black';
        transferInputCell.appendChild(transferInput);
        row.appendChild(transferInputCell);

        const transferDisplayCell = document.createElement('td');
        transferDisplayCell.style.textAlign = 'right';
        transferDisplayCell.textContent = transfer + ' Hz';
        row.appendChild(transferDisplayCell);

        transferInput.addEventListener('input', event => {
            const value = Number(event.target.value) === 0 ? 0 : Math.round(10 ** Number(event.target.value));
            transferDisplayCell.textContent = value + ' Hz';
            transferGain[sourceIndex][sinkIndex] = value;
        });
    });

    return row;
}

function buildTableBody() {
    const tbody = document.createElement('tbody');
    [...Array(operatorCount)].forEach((_, sourceIndex) => tbody.appendChild(buildTableRow(sourceIndex)));
    return tbody;
}

function resetParameters() {
    operatorFrequency = Array(operatorCount).fill(1).fill(200, 0, 1);
    operatorVolume = Array(operatorCount).fill(0).fill(100, 0, 1);
    transferGain = [...Array(operatorCount)].map(() => Array(operatorCount).fill(0));
}

function buildUI() {
    const oldTable = document.querySelector('main > table');
    if (oldTable) {
        oldTable.remove();
    }

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.appendChild(buildTableHeader());
    table.appendChild(buildTableBody());
    document.querySelector('main').appendChild(table);
}

resetParameters();
buildUI();

document.querySelector('#operator-count').addEventListener('input', event => {
    operatorCount = Math.round(Number(event.target.value));
    resetParameters();
    buildUI();
});
document.querySelector('#randomise').addEventListener('click', randomise);
document.querySelector('#start-button').addEventListener('click', onStart);
