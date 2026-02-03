interface ProfileSectionTitleProps {
  title: string;
}

export const ProfileSectionTitle = ({ title }: ProfileSectionTitleProps) => {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
      {title}
    </h3>
  );
};
