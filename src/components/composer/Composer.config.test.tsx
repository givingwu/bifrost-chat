import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import { useChatStore } from '@/store';
import { Composer, type ComposerRef } from './Composer';

vi.mock('@/hooks/use-template-preview.hook', () => ({
  useTemplatePreview: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      previewContent: '模板内容',
      params: undefined,
    }),
  }),
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderComposer(
  config?: Parameters<typeof ConfigProvider>[0]['config'],
) {
  return render(
    <ConfigProvider config={config ?? {}}>
      <Composer
        conversationId="conv-config"
        channel={ChannelTypeEnum.WhatsApp}
      />
    </ConfigProvider>,
  );
}

function TemplateOnlyHarness() {
  const composerRef = useRef<ComposerRef>(null);

  return (
    <ConfigProvider
      config={{
        composer: {
          inputMode: 'template-only',
          allowTemplateEdit: false,
          placeholder: '请选择模板内容',
        },
      }}
    >
      <button
        type="button"
        onClick={() => {
          composerRef.current?.setTemplate({
            content: '模板内容',
            templateCode: 'template-001',
          });
        }}
      >
        回填模板
      </button>
      <Composer
        ref={composerRef}
        conversationId="conv-template-only"
        channel={ChannelTypeEnum.WhatsApp}
      />
    </ConfigProvider>
  );
}

describe('Composer config integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.setState(useChatStore.getInitialState(), true);
  });

  afterEach(() => {
    localStorage.clear();
    useChatStore.setState(useChatStore.getInitialState(), true);
  });

  it('应使用 ConfigProvider 注入的 placeholder', () => {
    renderComposer({
      composer: {
        placeholder: '请选择模板内容',
      },
    });

    expect(screen.getByTestId('composer-input')).toHaveAttribute(
      'placeholder',
      '请选择模板内容',
    );
  });

  it('template-only 模式下清空模板后仍应保持只读', () => {
    render(<TemplateOnlyHarness />);

    const input = screen.getByTestId('composer-input');

    expect(input).toHaveAttribute('readonly');

    fireEvent.click(screen.getByRole('button', { name: '回填模板' }));

    expect(input).toHaveValue('模板内容');
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByTestId('composer-clear')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('composer-clear'));

    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('readonly');
    expect(screen.queryByTestId('composer-clear')).not.toBeInTheDocument();
  });
});
