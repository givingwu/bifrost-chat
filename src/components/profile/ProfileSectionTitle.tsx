interface ProfileSectionTitleProps {
  title: string;
}

export const ProfileSectionTitle = ({ title }: ProfileSectionTitleProps) => {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {title}
    </h3>
  );
};
