import type { ContactAccessField } from "./types";
import styles from "./Friends.module.css";

type Props = {
  fields: readonly { field: ContactAccessField; value: string }[];
};

export function ContactPanel({ fields }: Props) {
  if (fields.length === 0) {
    return (
      <div className={styles.state} role="status">
        Dane kontaktowe nie są dostępne dla tego widoku.
      </div>
    );
  }
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Panel kontaktu</h3>
      <div className={styles.shell}>
        {fields.map((field) => (
          <div key={field.field}>
            <strong>{field.field}:</strong> {field.value}
          </div>
        ))}
      </div>
    </section>
  );
}
