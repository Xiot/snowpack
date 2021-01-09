import {
  DependencyStatsOutput,
  install,
  InstallOptions as EsinstallOptions,
  InstallTarget,
  printStats,
} from 'esinstall';
import * as colors from 'kleur/colors';
import path from 'path';
import {performance} from 'perf_hooks';
import util from 'util';
import {logger} from '../logger';
import {ImportMap, SnowpackConfig} from '../types';
import {writeLockfile} from '../util.js';

interface InstallRunOptions {
  config: SnowpackConfig;
  installOptions: EsinstallOptions;
  installTargets: InstallTarget[];
  shouldWriteLockfile: boolean;
  shouldPrintStats: boolean;
}

interface InstallRunResult {
  importMap: ImportMap;
  newLockfile: ImportMap | null;
  stats: DependencyStatsOutput | null;
}

export async function run({
  config,
  installOptions,
  installTargets,
  shouldWriteLockfile,
  shouldPrintStats,
}: InstallRunOptions): Promise<InstallRunResult> {
  // start
  const installStart = performance.now();
  // logger.info(
  //   colors.yellow(
  //     '! installing dependencies...' +
  //       colors.cyan(
  //         config.packageOptions.source === 'local' ? '' : ` (source: ${config.packageOptions.source})`,
  //       ),
  //   ),
  // );

  if (installTargets.length === 0) {
    return {
      importMap: {imports: {}} as ImportMap,
      newLockfile: null,
      stats: null,
    };
  }

  let newLockfile: ImportMap | null = null;
  const finalResult = await install(installTargets, {
    cwd: config.root,
    importMap: newLockfile || undefined,
    alias: config.alias,
    logger: {
      debug: (...args: [any, ...any[]]) => logger.debug(util.format(...args)),
      log: (...args: [any, ...any[]]) => logger.info(util.format(...args)),
      warn: (...args: [any, ...any[]]) => logger.warn(util.format(...args)),
      error: (...args: [any, ...any[]]) => logger.error(util.format(...args)),
    },
    ...installOptions,
  });

  logger.debug('Install ran successfully!');
  if (shouldWriteLockfile && newLockfile) {
    await writeLockfile(path.join(config.root, 'snowpack.lock.json'), newLockfile);
    logger.debug('Successfully wrote lockfile');
  }

  // finish
  const installEnd = performance.now();
  const depList = (finalResult.importMap && Object.keys(finalResult.importMap.imports)) || [];
  logger.info(
    `${
      depList.length
        ? colors.green(`✔`) + ' install complete!'
        : 'install skipped (nothing to install)'
    } ${colors.dim(`[${((installEnd - installStart) / 1000).toFixed(2)}s]`)}`,
  );

  if (shouldPrintStats && finalResult.stats) {
    logger.info(printStats(finalResult.stats));
  }

  return {
    importMap: finalResult.importMap,
    newLockfile,
    stats: finalResult.stats!,
  };
}
