import { useEffect, useRef } from 'react';
import { throttle } from '../../common/utils';

const getFirstOverflowRoot = (el: HTMLElement): HTMLElement | null => {
	if (el.tagName === 'html') {
		return null;
	}
	let parent = el.parentElement;
	if (!parent) {
		return null;
	}
	let computedStyle = window.getComputedStyle(parent, null);
	if (
		computedStyle.overflow === 'auto' ||
		computedStyle.overflowX === 'auto' ||
		computedStyle.overflowY === 'auto' ||
		computedStyle.overflow === 'scroll' ||
		computedStyle.overflowX === 'scroll' ||
		computedStyle.overflowY === 'scroll'
	) {
		return parent;
	} else {
		return getFirstOverflowRoot(parent);
	}
};

const getElementMargin = (el: HTMLElement | null) => {
	if (!el) {
		return '0px 0px 0px 0px';
	}
	let computedStyle = window.getComputedStyle(el, null);
	return `${computedStyle.marginTop} ${computedStyle.marginRight} ${computedStyle.marginBottom} ${computedStyle.marginLeft}`;
};

const computedThreshold = (threshold: number[] | number) => {
	if (typeof threshold === 'number') {
		if (threshold === 0 || threshold === 1) {
			return threshold;
		} else {
			return [threshold / 2, 1 - threshold / 2];
		}
	} else {
		return [threshold[0], threshold[1]];
	}
};

const computedIsIn = (
	threshold: number[] | 0 | 1,
	el: { width: number; height: number; offsetLeft: number; offsetTop: number },
	root: {
		width: number;
		height: number;
		scrollTop: number;
		scrollLeft: number;
	}
): boolean => {
	const { width, height, offsetLeft, offsetTop } = el;
	const { width: parentWidth, height: parentHeight, scrollTop, scrollLeft } = root;
	let extraX = 0,
		extraY = 0;
	if (threshold === 0) {
		extraX = 0;
		extraY = 0;
	} else if (threshold === 1) {
		extraX = width;
		extraY = height;
	} else {
		let [firstRatio, secondRatio] = threshold || [];
		let extraX1 = 0,
			extraX2 = 0,
			extraY1 = 0,
			extraY2 = 0;
		if (typeof firstRatio !== 'undefined') {
			extraX1 = width * firstRatio;
			extraY1 = height * firstRatio;
		}
		if (typeof secondRatio !== 'undefined') {
			extraX2 = width * secondRatio;
			extraY2 = height * secondRatio;
		}
		return (
			offsetTop + extraY2 >= scrollTop &&
			offsetTop + extraY1 <= scrollTop + parentHeight &&
			offsetLeft + extraX2 >= scrollLeft &&
			offsetLeft + extraX1 <= scrollLeft + parentWidth
		);
	}
	return (
		offsetTop + height - extraY >= scrollTop &&
		offsetTop + extraY <= scrollTop + parentHeight &&
		offsetLeft + width - extraX >= scrollLeft &&
		offsetLeft + extraX <= scrollLeft + parentWidth
	);
};

export default function useScrollInOut<E extends HTMLElement>(
	scrollInOutFallback: (isIn: boolean) => any,
	threshold: number[] | number = 0.75
) {
	const fallbackRef = useRef(scrollInOutFallback);
	const ref = useRef<E>();
	fallbackRef.current = scrollInOutFallback;
	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		const fallback = (isIn: boolean) => fallbackRef.current(isIn);
		const thresholdRes = computedThreshold(threshold);
		if (
			'IntersectionObserver' in window &&
			'IntersectionObserverEntry' in window &&
			'intersectionRatio' in window.IntersectionObserverEntry.prototype
		) {
			// IntersectionObserver实现
			const root = getFirstOverflowRoot(el);
			let margin = getElementMargin(root);
			let isScrollIn = false;
			const observer = new IntersectionObserver(
				entries => {
					if (entries[0].isIntersecting) {
						// 进入可视区域
						if (!isScrollIn) {
							isScrollIn = true;
							fallback(isScrollIn);
						}
					} else {
						// 移出可视区域
						if (isScrollIn) {
							isScrollIn = false;
							fallback(isScrollIn);
						}
					}
				},
				{
					root: root,
					rootMargin: margin,
					threshold: thresholdRes
				}
			);
			observer.observe(el);
			return () => observer.disconnect();
		} else {
			// 手动实现
			const root = getFirstOverflowRoot(el);
			let isScrollIn = false;
			const scrollHandler = (ev: Event) => {
				let scrollTop: number, scrollLeft: number, parentWidth: number, parentHeight: number;
				const target = ev.target as HTMLElement;
				if (root) {
					scrollTop = target.scrollTop;
					scrollLeft = target.scrollLeft;
					let rect = target.getBoundingClientRect();
					parentWidth = rect.width;
					parentHeight = rect.height;
				} else {
					scrollTop = window.scrollX;
					scrollLeft = window.scrollY;
					parentWidth = window.innerWidth;
					parentHeight = window.innerHeight;
				}
				let { offsetTop, offsetLeft } = el;
				let { width, height } = el.getBoundingClientRect();
				if (
					computedIsIn(
						thresholdRes,
						{ width, height, offsetLeft, offsetTop },
						{
							width: parentWidth,
							height: parentHeight,
							scrollLeft,
							scrollTop
						}
					)
				) {
					// scroll x & y in
					if (!isScrollIn) {
						isScrollIn = true;
						fallback(isScrollIn);
					}
				} else {
					// scroll x & y out
					if (isScrollIn) {
						isScrollIn = false;
						fallback(isScrollIn);
					}
				}
			};
			const throttleHandler = throttle(scrollHandler, 100, null, true);
			const eventRoot = root || window;
			eventRoot.addEventListener('scroll', throttleHandler);
			// 初始化判断
			let myEvent = new Event('scroll');
			eventRoot.dispatchEvent(myEvent);
			return () => eventRoot.removeEventListener('scroll', throttleHandler);
		}
	}, [ref.current, threshold]);
	return ref;
}
