export async function redirectSystemPath({ path, initial }: { path: string | undefined; initial: boolean }): Promise<string> {
  try {
    if (!path) {
      return '/';
    }

    // Strip custom scheme if it's included in the path string
    if (path.startsWith('smartpos://')) {
      const stripped = path.replace('smartpos://', '');
      return stripped === '' ? '/' : (stripped.startsWith('/') ? stripped : '/' + stripped);
    }

    return path;
  } catch (error) {
    console.error('Error in redirectSystemPath:', error);
    return '/';
  }
}
