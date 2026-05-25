import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./SubmitButton.module.css";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function SubmitButton({ children, className, ...rest }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      {...rest}
      className={`${styles.submit} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

type FormNoticeProps = {
  title?: string;
  children: ReactNode;
};

export function FormNotice({ title, children }: FormNoticeProps) {
  return (
    <div className={styles.notice} role="status">
      {title ? <div className={styles.noticeStrong}>{title}</div> : null}
      <div>{children}</div>
    </div>
  );
}
