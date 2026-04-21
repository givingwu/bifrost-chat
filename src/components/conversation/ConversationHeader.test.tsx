import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from '../SearchInput';
import { ConversationHeader } from './ConversationHeader';

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'conversation.title': '会话',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('ConversationHeader', () => {
  it('应按 title + extra + search 的结构渲染头部内容', () => {
    render(
      <ConversationHeader
        title="会话"
        extra={<div data-testid="header-extra">账号管理</div>}
        search={
          <SearchInput type="search" value="" onChange={() => undefined} />
        }
      />,
    );

    expect(screen.getByText('会话')).toBeInTheDocument();
    expect(screen.getByTestId('header-extra')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('未传 search 时不应渲染搜索框', () => {
    render(<ConversationHeader title="会话" />);

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('应渲染 children 内容', () => {
    render(
      <ConversationHeader title="会话">
        <div data-testid="header-children">筛选器</div>
      </ConversationHeader>,
    );

    expect(screen.getByTestId('header-children')).toBeInTheDocument();
  });
});
