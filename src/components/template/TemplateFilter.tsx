import { memo } from 'react';

export const TemplateFilter = memo(function TemplateFilter() {
  return (
    {/* 头部 */}
          <div
  className =
    'border-b border-border px-4 py-3' >
    {
      /* 搜索框 */
    } <
    div;
  className =
    'mt-2 relative' >
    (
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search..."
        clearable
      />
    );
  </div>
  categories.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        type="button"
        onClick={() => setSelectedCategory(undefined)}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition',
          'border',
          !selectedCategory
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-text hover:border-primary/50',
        )}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          type="button"
          onClick={() => setSelectedCategory(category)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            'border',
            selectedCategory === category
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-text hover:border-primary/50',
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );
  </div>
  )
});
