import type { ContactAccessField } from "./types";
import styles from "./Friends.module.css";

type Props = {
  selected: readonly ContactAccessField[];
  onChange?: (next: readonly ContactAccessField[]) => void;
};

const FIELDS: readonly ContactAccessField[] = [
  "email",
  "phone",
  "website",
  "otherContactMethods",
];

export function ContactAccessFieldsSelector({ selected, onChange }: Props) {
  const selectedSet = new Set(selected);
  return (
    <div className={styles.fields}>
      {FIELDS.map((field) => (
        <label key={field} className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selectedSet.has(field)}
            onChange={(event) => {
              if (!onChange) return;
              const next = new Set(selected);
              if (event.target.checked) next.add(field);
              else next.delete(field);
              onChange([...next]);
            }}
          />
          {field}
        </label>
      ))}
    </div>
  );
}
