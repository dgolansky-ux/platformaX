import type { SocialLink, SocialLinkKind } from "../types";
import styles from "../profile.module.css";

type ProfileSocialLinksProps = {
  links: ReadonlyArray<SocialLink>;
};

const KIND_CLASS: Record<SocialLinkKind, string> = {
  linkedin: styles.socialLinkedin,
  github: styles.socialGithub,
  instagram: styles.socialInstagram,
  website: styles.socialWebsite,
};

const KIND_SHORT: Record<SocialLinkKind, string> = {
  linkedin: "in",
  github: "GH",
  instagram: "IG",
  website: "www",
};

export function ProfileSocialLinks({ links }: ProfileSocialLinksProps) {
  if (links.length === 0) return null;
  return (
    <nav className={styles.socialLinks} aria-label="Linki społecznościowe">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.socialLink} ${KIND_CLASS[link.kind]}`}
          aria-label={link.label}
        >
          {KIND_SHORT[link.kind]}
        </a>
      ))}
    </nav>
  );
}
