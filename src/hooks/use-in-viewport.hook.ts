import { useEffect, useRef, useState } from 'react';

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
  /**
   * opacity 门控节点：当该节点 `opacity` <= opacityThreshold 时，
   * 不更新 inViewport（避免父级透明动画导致误判）。
   *
   * 不传时会自动推断：从 target 的父级开始向上查找第一个
   * `opacity !== 1` 的祖先元素；若都为 1，则退回到父级作为监听对象。
   */
  opacityRoot?: BasicTarget<Element>;
  /**
   * 认为“不透明可见”的阈值，opacity <= threshold 视为不可见。
   * @default 0.01
   */
  opacityThreshold?: number;
}

interface ViewportState {
  inViewport: boolean;
  ratio: number;
}

const DEFAULT_VIEWPORT_STATE: ViewportState = {
  inViewport: false,
  ratio: 0,
};

const DEFAULT_OPACITY_THRESHOLD = 0.01;

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

function getComputedOpacity(target: Element): number {
  try {
    const opacityValue = window.getComputedStyle(target).opacity;
    const parsed = Number.parseFloat(opacityValue);
    return Number.isFinite(parsed) ? parsed : 1;
  } catch {
    return 1;
  }
}

function inferOpacityRootFromTarget(target: Element): Element | null {
  // SSR / 非浏览器环境直接返回父级
  if (typeof window === 'undefined') return target.parentElement;

  let current: Element | null = target.parentElement;
  const fallback: Element | null = current;
  while (current) {
    const opacity = getComputedOpacity(current);
    if (opacity !== 1) return current;
    current = current.parentElement;
  }
  return fallback;
}

type OpacityCallback = (opacity: number) => void;

interface OpacitySubscriptionRecord {
  listeners: Set<OpacityCallback>;
  mutationObserver?: MutationObserver;
  intervalId?: number;
  lastOpacity: number;
}

const opacitySubscriptions = new WeakMap<Element, OpacitySubscriptionRecord>();

function subscribeToOpacityChanges(
  opacityRootElement: Element,
  callback: OpacityCallback,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let record = opacitySubscriptions.get(opacityRootElement);
  if (!record) {
    const lastOpacity = getComputedOpacity(opacityRootElement);
    record = { listeners: new Set<OpacityCallback>(), lastOpacity };
    const recordRef = record;

    const startIntervalIfNeeded = (forceStart = false) => {
      // 只在 `opacity` 接近 0 的时候轮询：保证 0->1 的过渡能被捕获
      // 同时避免在可见状态下无意义轮询。
      const shouldPoll =
        forceStart || getComputedOpacity(opacityRootElement) <= DEFAULT_OPACITY_THRESHOLD;
      if (!shouldPoll || recordRef.intervalId != null) return;

      recordRef.intervalId = window.setInterval(() => {
        const opacity = getComputedOpacity(opacityRootElement);
        recordRef.lastOpacity = opacity;
        for (const listener of recordRef.listeners) listener(opacity);

        if (opacity > DEFAULT_OPACITY_THRESHOLD) {
          window.clearInterval(recordRef.intervalId);
          recordRef.intervalId = undefined;
        }
      }, 100);
    };

    if (typeof MutationObserver !== 'undefined') {
      const mutationObserver = new MutationObserver(() => {
        const opacity = getComputedOpacity(opacityRootElement);
        recordRef.lastOpacity = opacity;
        for (const listener of recordRef.listeners) listener(opacity);
        startIntervalIfNeeded(false);
      });

      mutationObserver.observe(opacityRootElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
      record.mutationObserver = mutationObserver;
    }

    // 初始时如果不可见，立刻启动轮询以捕获 0->1。
    startIntervalIfNeeded(true);
    opacitySubscriptions.set(opacityRootElement, record);
  }

  record.listeners.add(callback);

  // 立即回调一次，避免等待下一次 mutation/interval。
  callback(record.lastOpacity);

  return () => {
    const currentRecord = opacitySubscriptions.get(opacityRootElement);
    if (!currentRecord) return;

    currentRecord.listeners.delete(callback);
    if (currentRecord.listeners.size > 0) return;

    if (currentRecord.intervalId != null) {
      window.clearInterval(currentRecord.intervalId);
    }
    currentRecord.intervalId = undefined;

    currentRecord.mutationObserver?.disconnect();
    opacitySubscriptions.delete(opacityRootElement);
  };
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
  const lastIntersectionRef = useRef<ViewportState | null>(null);
  const opacityVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const element = resolveTarget(target);

    if (!element) {
      setState(DEFAULT_VIEWPORT_STATE);
      return;
    }

    const opacityThreshold =
      typeof options.opacityThreshold === 'number'
        ? options.opacityThreshold
        : DEFAULT_OPACITY_THRESHOLD;

    const opacityRootElement =
      resolveTarget(options.opacityRoot) ??
      inferOpacityRootFromTarget(element);

    lastIntersectionRef.current = null;

    const computeViewportState = (): ViewportState => {
      const rect = element.getBoundingClientRect();
      const resolvedRoot = resolveTarget(options.root);

      const rootRect = resolvedRoot
        ? resolvedRoot.getBoundingClientRect()
        : ({
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
          } as DOMRect);

      const intersectLeft = Math.max(rect.left, rootRect.left);
      const intersectRight = Math.min(rect.right, rootRect.right);
      const intersectTop = Math.max(rect.top, rootRect.top);
      const intersectBottom = Math.min(rect.bottom, rootRect.bottom);

      const intersectWidth = Math.max(0, intersectRight - intersectLeft);
      const intersectHeight = Math.max(0, intersectBottom - intersectTop);

      const intersectionArea = intersectWidth * intersectHeight;
      const targetArea = rect.width * rect.height;
      const ratio = targetArea > 0 ? intersectionArea / targetArea : 0;

      const threshold = options.threshold;
      const thresholdMin = Array.isArray(threshold)
        ? Math.min(...threshold)
        : typeof threshold === 'number'
          ? threshold
          : 0;

      // 当 threshold 未设置时：只要有交集就视为可见。
      const shouldConsiderVisible =
        typeof threshold === 'number' || Array.isArray(threshold)
          ? ratio >= thresholdMin
          : ratio > 0;

      return {
        inViewport: shouldConsiderVisible,
        ratio: shouldConsiderVisible ? ratio : 0,
      };
    };

    const syncStateByOpacity = (opacity: number) => {
      const visible = opacity > opacityThreshold;
      opacityVisibleRef.current = visible;

      if (!visible) {
        setState({ inViewport: false, ratio: 0 });
        return;
      }

      // opacity 变为可见后，立刻使用上一次 Intersection 结果刷新。
      if (lastIntersectionRef.current) {
        setState(lastIntersectionRef.current);
        return;
      }

      // 兜底：若 IO 还没回调（或在不支持 IO 的环境），用几何计算一次，
      // 并按 threshold 语义裁剪触发时机。
      const next = computeViewportState();
      lastIntersectionRef.current = next;
      setState(next);
    };

    // 初始化 opacity 状态；当 opacity 为 0 时，冻结可见性输出。
    if (opacityRootElement) {
      syncStateByOpacity(getComputedOpacity(opacityRootElement));
    } else {
      opacityVisibleRef.current = true;
    }

    let observer: IntersectionObserver | null = null;
    let unsubscribeOpacity: (() => void) | undefined;

    // 监听 opacityRoot 的变化：确保 0->1 后能触发重新判断。
    if (opacityRootElement) {
      unsubscribeOpacity = subscribeToOpacityChanges(
        opacityRootElement,
        (opacity) => syncStateByOpacity(opacity),
      );
    }

    // IO 支持：将 intersection 结果缓存起来，但只在 opacity 可见时更新 state。
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;

          const next: ViewportState = {
            inViewport: entry.isIntersecting,
            ratio: entry.intersectionRatio,
          };
          lastIntersectionRef.current = next;

          if (opacityRootElement && !opacityVisibleRef.current) return;
          setState(next);
        },
        {
          root: resolveTarget(options.root),
          rootMargin: options.rootMargin,
          threshold: options.threshold,
        },
      );

      observer.observe(element);
    } else {
      // 不支持 IO：只做一次几何判断（并由 opacity 门控决定是否暴露结果）。
      if (!opacityRootElement || opacityVisibleRef.current) {
        const next = computeViewportState();
        lastIntersectionRef.current = next;
        setState(next);
      }
    }

    return () => {
      observer?.disconnect();
      unsubscribeOpacity?.();
    };
  }, [
    target,
    options.root,
    options.rootMargin,
    options.threshold,
    options.opacityRoot,
    options.opacityThreshold,
  ]);

  return [state.inViewport, state.ratio];
}
