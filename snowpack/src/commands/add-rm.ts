import {send} from 'httpie';
import {cyan, dim, underline} from 'kleur/colors';
import path from 'path';
import {generateImportMap} from 'skypack';
import {logger} from '../logger';
import {CommandOptions, LockfileManifest} from '../types';
import {LOCKFILE_NAME, writeLockfile} from '../util';

export async function addCommand(addValue: string, commandOptions: CommandOptions) {
  const {lockfile, config} = commandOptions;
  if (config.packageOptions.source !== 'skypack') {
    throw new Error(`add command requires packageOptions.source="skypack".`);
  }
  let [pkgName, pkgSemver] = addValue.split('@');
  const installMessage = pkgSemver ? `${pkgName}@${pkgSemver}` : pkgName;
  logger.info(`fetching ${cyan(installMessage)} from Skypack CDN...`);
  if (!pkgSemver || pkgSemver === 'latest') {
    const {data} = await send('GET', `http://registry.npmjs.org/${pkgName}/latest`);
    pkgSemver = `^${data.version}`;
  }
  logger.info(
    `adding ${cyan(
      underline(`https://cdn.skypack.dev/${pkgName}@${pkgSemver}`),
    )} to your project lockfile. ${dim(`(${LOCKFILE_NAME})`)}`,
  );
  const addedDependency = {[pkgName]: pkgSemver};
  const newLockfile: LockfileManifest = {
    ...(await generateImportMap(addedDependency, lockfile || undefined)),
    dependencies: {
      ...lockfile?.dependencies,
      ...addedDependency,
    },
  };
  await writeLockfile(path.join(config.root, LOCKFILE_NAME), newLockfile);
}

export async function rmCommand(addValue: string, commandOptions: CommandOptions) {
  const {lockfile, config} = commandOptions;
  if (config.packageOptions.source !== 'skypack') {
    throw new Error(`rm command requires packageOptions.source="skypack".`);
  }
  let [pkgName] = addValue.split('@');
  logger.info(`removing ${cyan(pkgName)} from project lockfile...`);
  const newLockfile: LockfileManifest = {
    ...(await generateImportMap({[pkgName]: null}, lockfile || undefined)),
    dependencies: lockfile?.dependencies ?? {},
  };
  delete newLockfile.dependencies[pkgName];
  await writeLockfile(path.join(config.root, LOCKFILE_NAME), newLockfile);
}
