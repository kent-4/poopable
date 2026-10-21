/** Emulator tooling deliberately cannot accept a cloud project or non-loopback host. */
export function readEmulatorConfig(env = process.env) {
  const projectId = env.POOPABLE_FIREBASE_PROJECT_ID ?? 'demo-poopable';
  const host = env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
  if (!/^demo-[a-z0-9-]+$/.test(projectId)) {
    throw new Error(
      'POOPABLE_FIREBASE_PROJECT_ID must use a demo- project ID.',
    );
  }
  const match = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(host);
  if (!match)
    throw new Error(
      'FIRESTORE_EMULATOR_HOST must use a loopback host and port.',
    );
  const port = Number(match[2]);
  if (port < 1 || port > 65535) throw new Error('Invalid emulator port.');
  return { projectId, host };
}
