import styles from "./Friends.module.css";

type Props = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function RelationshipActionButton({
  label,
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
