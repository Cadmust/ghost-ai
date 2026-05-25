import { Liveblocks } from '@liveblocks/node';

const liveblocksClientSingleton = () => {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error('LIVEBLOCKS_SECRET_KEY environment variable is not set');
  }

  return new Liveblocks({ secret });
};

declare global {
  // eslint-disable-next-line no-var
  var liveblocks: undefined | ReturnType<typeof liveblocksClientSingleton>;
}

const liveblocks = globalThis.liveblocks ?? liveblocksClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.liveblocks = liveblocks;
}

export default liveblocks;