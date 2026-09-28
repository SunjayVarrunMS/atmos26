import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../world/sound';

const get = () => sound.enabled;

// Sound for the ascent: off until asked for, and remembered.
export function SoundToggle() {
  const on = useSyncExternalStore((fn) => sound.subscribe(fn), get, () => false);
  const Icon = on ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      onClick={() => sound.toggle()}
      aria-pressed={on}
      className={`flex h-11 items-center gap-2 px-1 text-[0.95rem] font-medium transition-colors duration-300 ${
        on ? 'text-brass-hi' : 'text-stone-dim hover:text-stone'
      }`}
    >
      <Icon aria-hidden size={16} strokeWidth={1.5} />
      <span>Sound</span>
    </button>
  );
}
