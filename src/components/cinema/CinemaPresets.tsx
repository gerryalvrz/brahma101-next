"use client";

import {
  cinemaPresets,
  type CinemaPreset,
} from "@/data/cinema/presets";
import styles from "./cinema.module.css";

type Props = {
  activeId: string | null;
  onSelect: (preset: CinemaPreset) => void;
  disabled?: boolean;
};

export default function CinemaPresets({ activeId, onSelect, disabled }: Props) {
  return (
    <div className={styles.presets} role="list">
      {cinemaPresets.map((preset) => {
        const active = preset.id === activeId;
        return (
          <button
            key={preset.id}
            type="button"
            role="listitem"
            className={
              active ? `${styles.presetChip} ${styles.presetActive}` : styles.presetChip
            }
            title={preset.description}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(preset)}
          >
            {preset.trail}
          </button>
        );
      })}
    </div>
  );
}
