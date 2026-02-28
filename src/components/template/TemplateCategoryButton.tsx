import { Button } from '@/components/Button';
import { cn } from '@/utils/class.util';

export interface TemplateCategoryButtonProps {
  /** 是否选中 */
  isSelected: boolean;
  /** 点击回调 */
  onClick: () => void;
  /** 按钮标签 */
  label: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * TemplateCategoryButton 组件
 *
 * 模板分类按钮组件
 *
 * @example
 * ```tsx
 * <TemplateCategoryButton
 *   isSelected={true}
 *   onClick={() => console.log('点击')}
 *   label="分类名称"
 * />
 * ```
 */
export const TemplateCategoryButton = ({
  isSelected,
  onClick,
  label,
  className,
}: TemplateCategoryButtonProps) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition tracking-wider',
        isSelected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-gray-400 hover:text-gray-500 hover:border-primary/50',
        className,
      )}
      aria-pressed={isSelected}
      aria-label={`${label} ${isSelected ? '(Selected)' : ''}`}
    >
      {label}
    </Button>
  );
};
