import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../src/data/pipes.json', import.meta.url);
const pipes = JSON.parse(readFileSync(path, 'utf8'));

for (const pipe of pipes) {
  const calculated = 0.02466 * pipe.wallThickness * (pipe.diameter - pipe.wallThickness);
  pipe.weightPerMeter = Number(calculated.toFixed(2));
}

writeFileSync(path, `${JSON.stringify(pipes, null, 2)}\n`, 'utf8');
console.log(`Updated ${pipes.length} pipe weights`);
