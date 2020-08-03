const path = require("path");
const fse = require("fs-extra");
const commander = require("commander");
const execa = require("execa");
const Listr = require("listr");
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
    // shell: true,
    // stdio: "inherit",
    cwd: projectPath,
  });
}

commander
  .command("build")
  .arguments("<type>")
  .option("-m, --min", "同时生成压缩文件")
  .description("项目构建")
  .action(async function (type, cmd) {
    const needMinify = cmd.min;
    const isTs = type.toLowerCase() === "ts";
    const isJs = type.toLowerCase() === "js";
    const buildTs = "tsc";
    const buildJs =
      (isJs && "rollup --config rollup.config.js") ||
      (isTs && `rollup --config rollup.config.js --input ${tscTempEntry}`) ||
      "";
    const minifyJs = `terser ${"dist/index.js"} --compress -o ${"dist/index.min.js"} --source-map`;

    const listr = new Listr([
      {
        title: "清空输出目录",
        task: async () => {
          if (type === "ts") {
            await fse.emptyDir(tscTempPath);
            await fse.emptyDir(tscTypePath);
          }
          await fse.emptyDir(buildJsPath);
        },
      },
      {
        title: "转换 ts 文件",
        enabled: () => isTs,
        task: () => executeScript(buildTs),
      },
      {
        title: "构建输出文件",
        task: () => executeScript(buildJs),
      },
      {
        title: "生成压缩文件",
        enabled: () => needMinify,
        task: () => executeScript(minifyJs),
      },
    ]);

    listr.run().catch((error) => {
      console.error(error);
    });
  });

commander.parse(process.argv);
