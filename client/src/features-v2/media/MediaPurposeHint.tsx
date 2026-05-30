/**
 * features-v2/media — MediaPurposeHint.
 *
 * Renders the human-readable limits for a purpose ("JPG/PNG/WEBP, max 5 MB,
 * 1 plik"). Reads from the purpose definition so it stays in sync with
 * backend limits without duplicating numbers.
 */
import type { MediaPurposeDefinitionDTO } from "@shared/contracts/media";
import styles from "./Media.module.css";

interface Props {
  definition: MediaPurposeDefinitionDTO;
}

function formatMimeShort(mime: string): string {
  if (mime.startsWith("image/")) return mime.slice(6).toUpperCase();
  if (mime.startsWith("video/")) return `VIDEO/${mime.slice(6).toUpperCase()}`;
  return mime;
}

export function MediaPurposeHint({ definition }: Props) {
  const types = Array.from(new Set(definition.allowedMimeTypes.map(formatMimeShort))).join(
    ", ",
  );
  const sizeMb = Math.round(definition.maxSizeBytes / (1024 * 1024));
  const filesLabel =
    definition.maxFiles === 1 ? "1 plik" : `do ${definition.maxFiles} plików`;
  return (
    <p className={styles.hint}>
      {types}, maks. {sizeMb} MB, {filesLabel}.
    </p>
  );
}
