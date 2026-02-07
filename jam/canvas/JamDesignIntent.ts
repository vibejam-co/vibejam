export type JamDesignIntent = {
  prompt: string;
  mood?: 'calm' | 'focused' | 'aggressive' | 'institutional' | 'experimental';
  audience?: 'investors' | 'builders' | 'users' | 'underground';
};
