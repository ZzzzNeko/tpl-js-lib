const path = require("path");
const { spawnSync } = require("child_process");
const commander = require("commander");
const fse = require("fs-extra");
const tsconfig = require("../tsconfig.json");

const getProjectPath = (...d) => path.resolve(__dirname, "../", ...d);
const projectPath = getProjectPath("./");
const tscTempPath = getProjectPath(tsconfig.compilerOptions.outDir);
const tscTempEntry = getProjectPath(tscTempPath, "./main");

/**
 * 执行 npm script
 * @param { string } script npm script
 */
function executeScript(script) {
  spawnSync(script, {
    shell: true,
    stdio: "inherit",
    cwd: projectPath,
  });
}

commander
  .command("build")
  .arguments("<type>")
  .description("项目构建")
  .action(function (type, cmd) {
    if (type == "js") {
      const script = "rollup --config rollup.config.js";
      executeScript(script);
    }

    if (type == "ts") {
      const script = `tsc && rollup --config rollup.config.js --input ${tscTempEntry}`;
      executeScript(script);
      fse.emptyDirSync(tscTempPath);
    }
  });

commander.parse(process.argv);
