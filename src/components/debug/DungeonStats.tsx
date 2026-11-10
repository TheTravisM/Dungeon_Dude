import { StatsGl } from '@react-three/drei';
import styles from './DungeonStats.module.scss';

interface DungeonStatsProps {
  visible: boolean;
}

/**
 * Development-only frame diagnostics. StatsGl is never imported into the
 * production path because the whole component returns null outside a dev build.
 * It is also off by default and only mounts after the user enables it.
 */
export default function DungeonStats({ visible }: DungeonStatsProps) {
  if (!import.meta.env.DEV || !visible) return null;

  return <StatsGl className={styles.stats} />;
}
