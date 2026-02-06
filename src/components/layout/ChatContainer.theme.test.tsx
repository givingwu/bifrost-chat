import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import { useChatStore } from '@/store';
import { ChatContainer } from './ChatContainer';

interface MatchMediaController {
  mediaQueryList: MediaQueryList;
  setMatches: (matches: boolean) => void;
}

const createMatchMediaController = (
  initialMatches: boolean,
): MatchMediaController => {
  let currentMatches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList = {
    get matches() {
      return currentMatches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event !== 'change') {
          return;
        }
        if (typeof listener === 'function') {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
    ),
    removeEventListener: vi.fn(
      (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event !== 'change') {
          return;
        }
        if (typeof listener === 'function') {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
    ),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    mediaQueryList,
    setMatches: (matches: boolean) => {
      currentMatches = matches;
      const event = {
        matches,
        media: mediaQueryList.media,
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
};

const renderChatContainer = () =>
  render(
    <ChatContainer locale={LanguageCodeEnum.EnUS}>
      <div>theme-test-child</div>
    </ChatContainer>,
  );

const getContainerElement = (root: HTMLElement): HTMLElement => {
  const container = root.querySelector('[data-component="chat-container"]');
  if (!container) {
    throw new Error('chat-container DOM not found');
  }
  return container as HTMLElement;
};

describe('ChatContainer theme behavior', () => {
  beforeEach(() => {
    useChatStore.getState().actions.setTheme(ThemeModeEnum.Light);
    useChatStore.getState().actions.setSystemPrefersDark(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply dark class when theme is manually set to dark', async () => {
    const controller = createMatchMediaController(false);
    window.matchMedia = vi.fn().mockReturnValue(controller.mediaQueryList);
    useChatStore.getState().actions.setTheme(ThemeModeEnum.Dark);

    const { container } = renderChatContainer();
    const chatContainer = getContainerElement(container);

    await waitFor(() => {
      expect(chatContainer.getAttribute('data-theme')).toBe(ThemeModeEnum.Dark);
      expect(chatContainer.getAttribute('data-theme-resolved')).toBe(
        ThemeModeEnum.Dark,
      );
      expect(chatContainer.classList.contains('dark')).toBe(true);
    });
  });

  it('should resolve system theme to light when system prefers light', async () => {
    const controller = createMatchMediaController(false);
    window.matchMedia = vi.fn().mockReturnValue(controller.mediaQueryList);
    useChatStore.getState().actions.setTheme(ThemeModeEnum.System);

    const { container } = renderChatContainer();
    const chatContainer = getContainerElement(container);

    await waitFor(() => {
      expect(chatContainer.getAttribute('data-theme')).toBe(
        ThemeModeEnum.System,
      );
      expect(chatContainer.getAttribute('data-theme-resolved')).toBe(
        ThemeModeEnum.Light,
      );
      expect(chatContainer.classList.contains('dark')).toBe(false);
    });
  });

  it('should update resolved theme when system preference changes', async () => {
    const controller = createMatchMediaController(false);
    window.matchMedia = vi.fn().mockReturnValue(controller.mediaQueryList);
    useChatStore.getState().actions.setTheme(ThemeModeEnum.System);

    const { container } = renderChatContainer();
    const chatContainer = getContainerElement(container);

    await waitFor(() => {
      expect(chatContainer.getAttribute('data-theme-resolved')).toBe(
        ThemeModeEnum.Light,
      );
      expect(chatContainer.classList.contains('dark')).toBe(false);
    });

    controller.setMatches(true);

    await waitFor(() => {
      expect(chatContainer.getAttribute('data-theme-resolved')).toBe(
        ThemeModeEnum.Dark,
      );
      expect(chatContainer.classList.contains('dark')).toBe(true);
    });

    controller.setMatches(false);

    await waitFor(() => {
      expect(chatContainer.getAttribute('data-theme-resolved')).toBe(
        ThemeModeEnum.Light,
      );
      expect(chatContainer.classList.contains('dark')).toBe(false);
    });
  });
});
