/**
 * Roda docker compose (plugin v2) ou docker-compose (standalone v1).
 * Uso: node scripts/db-compose.js up -d
 */
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const shell = process.platform === "win32";

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, { stdio: "inherit", shell });
}

function available(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "ignore",
    shell,
  });
  return !result.error && result.status === 0;
}

let result;

if (available("docker", ["compose", "version"])) {
  result = run("docker", ["compose", ...args]);
} else if (available("docker-compose", ["version"])) {
  result = run("docker-compose", args);
} else {
  console.error(
    "Nem `docker compose` nem `docker-compose` estão disponíveis.\n" +
      "Na VPS antiga, instale: sudo apt install docker-compose\n" +
      "Ou o plugin: https://docs.docker.com/compose/install/",
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
