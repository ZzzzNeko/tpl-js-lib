const path = require("path");
const execa = require("execa");
const commander = require("commander");
const chalk = require("chalk");
const fse = require("fs-extra");
const ora = require("ora");
const tsconfig = require("../tsconfig.json");

const getProjectPath = (...d) => path.resolve(__dirname, "../", ...d);
const projectPath = getProjectPath("./");
const tscTempPath = getProjectPath(tsconfig.compilerOptions.outDir);
const tscTypePath = getProjectPath(tsconfig.compilerOptions.declarationDir);
const buildJsPath = getProjectPath("./dist");
const tscTempEntry = getProjectPath(tscTempPath, "./index");

/**
 * 执行 npm script
 * @param { string } script npm script
 */
function executeScript(script) {
  return execa(script, {
    shell: true,
    stdio: "inherit",
    cwd: projectPath,
  });
}

commander
  .command("build")
  .arguments("<type>")
  .description("项目构建")
  .action(async function (type, cmd) {
    if (type == "js") {
      const buildJs = "rollup --config rollup.config.js";
      await fse.emptyDir(buildJsPath);
      await executeScript(buildJs);
    }

    if (type == "ts") {
      const buildTs = "tsc";
      const buildJs = `rollup --config rollup.config.js --input ${tscTempEntry}`;
      await fse.emptyDir(tscTempPath);
      await fse.emptyDir(tscTypePath);
      await fse.emptyDir(buildJsPath);
      await executeScript(buildTs);
      await executeScript(buildJs);
    }
  });

commander.parse(process.argv);
