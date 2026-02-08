import { useEffect, useState } from 'react';

export type BasicTarget<TTarget extends Element = Element> =
  | TTarget
  | null
  | undefined
  | React.RefObject<TTarget | null>
  | (() => TTarget | null | undefined);

export interface UseInViewportOptions
  extends Omit<IntersectionObserverInit, 'root'> {
  /** 观察根节点，默认浏览器视口 */
  root?: BasicTarget<Element>;
}

interface ViewportState {
  inViewport: boolean;
  ratio: number;
}

const DEFAULT_VIEWPORT_STATE: ViewportState = {
  inViewport: false,
  ratio: 0,
};

function resolveTarget<TTarget extends Element>(
  target: BasicTarget<TTarget>,
): TTarget | null {
  if (!target) return null;

  if (typeof target === 'function') {
    return target() ?? null;
  }

  if (typeof target === 'object' && 'current' in target) {
    return target.current ?? null;
  }

  return target;
}

/**
 * useInViewport：类似 ahooks 的可见性检测 Hook
 *
 * @description
 * 监听目标元素是否进入可视区域，并返回可见状态与交叉比例。
 *
 * @param target 观察目标（元素、ref 或函数）
 * @param options IntersectionObserver 选项
 * @returns [inViewport, ratio]
 */
export function useInViewport(
  target: BasicTarget<Element>,
  options: UseInViewportOptions = {},
): [boolean, number] {
  const [state, setState] = useState<ViewportState>(DEFAULT_VIEWPORT_STATE);

  useEffect(() => {
    const element = resolveTarget(target);

    if (!element) {
      setState(DEFAULT_VIEWPORT_STATE);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      const rect = element.getBoundingClientRect();
      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      setState({
        inViewport: isVisible,
        ratio: isVisible ? 1 : 0,
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        setState({
          inViewport: entry.isIntersecting,
          ratio: entry.intersectionRatio,
        });
      },
      {
        root: resolveTarget(options.root),
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [target, options.root, options.rootMargin, options.threshold]);

  return [state.inViewport, state.ratio];
}
