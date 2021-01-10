import * as colors from 'kleur/colors';
import {logger} from '../logger';
import {CommandOptions} from '../types';
import {getPackageSource} from '../util';

export async function command(commandOptions: CommandOptions) {
  const {config} = commandOptions;
  logger.info(
    colors.yellow(
      '! preparing your project...' + colors.cyan(` (source: ${config.packageOptions.source})`),
    ),
  );
  const pkgSource = getPackageSource(config.packageOptions.source);
  await pkgSource.prepare(commandOptions);
}
