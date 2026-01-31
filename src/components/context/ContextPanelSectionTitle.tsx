interface ContextPanelSectionTitleProps {
  title: string;
}

export const ContextPanelSectionTitle = ({
  title,
}: ContextPanelSectionTitleProps) => {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
      {title}
    </h3>
  );
};
