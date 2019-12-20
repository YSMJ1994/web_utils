import moment, { Moment } from 'moment';

/**
 * 获取UUID
 */
export function UUID(): string {
	let s = [];
	let hexDigits = '0123456789abcdef';
	for (let i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = '4';
	s[19] = hexDigits.substr((Number(s[19]) & 0x3) | 0x8, 1);
	s[8] = s[13] = s[18] = s[23] = '';
	return s.join('');
}

/**
 * 获取目标的类型
 */
export function getType(target: any): string {
	const typeofType = typeof target;
	if (typeofType === 'object') {
		if (target === null) {
			return 'null';
		} else {
			return Object.prototype.toString
				.call(target)
				.replace(/^\[object\s(.*)]$/, '$1')
				.toLowerCase();
		}
	} else {
		return typeofType;
	}
}

/**
 * 字符串转正则字符串
 */
export function str2reg(str: string): string {
	return str.replace(/([.\\\[\]^$()?:*+|{},=!])/gi, '\\$1');
}

export type Time = string | number | Date | Moment | undefined;

/**
 * 格式化时间
 */
export function formatTime(time: Time = +moment(), format = 'YYYY-MM-DD HH:mm:ss') {
	return moment(time).format(format);
}

export enum ItemTypeEnum {
	value = 'value',
	key_value_obj = 'key_value_obj',
	key_value_arr = 'key_value_arr'
}

/**
 * 创建Object的迭代器
 */
export function* ObjectIterator(obj: any, type: ItemTypeEnum = ItemTypeEnum.value) {
	const keys = Object.keys(obj).sort((a, b) => (a > b ? 1 : -1));
	for (let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		switch (type) {
			case ItemTypeEnum.value: {
				yield obj[key];
				break;
			}
			case ItemTypeEnum.key_value_obj: {
				yield { key, value: obj[key] };
				break;
			}
			case ItemTypeEnum.key_value_arr: {
				yield [key, obj[key]];
				break;
			}
			default: {
				yield obj[key];
			}
		}
	}
}

/**
 * 判断是否是移动端
 */
export function isMobile(userAgent: string = navigator.userAgent): boolean {
	return /(iPhone|iPad|iPod|iOS|Android)/i.test(userAgent);
}

export type UrlParamsOption = {
	revertNumber?: boolean;
};

const numberValueRegExp = /^[1-9]\d*$/;

/**
 * 获取url参数
 */
export function getUrlParams<P>(
	url: string,
	key: string = '',
	option: UrlParamsOption = {
		revertNumber: false
	}
) {
	if (key) {
		return getUrlSingleParam<P>(url, key, option);
	} else {
		return getUrlAllParams<P>(url, option);
	}
}

export function getUrlAllParams<P extends { [key: string]: any }>(
	url: string,
	option: UrlParamsOption = {
		revertNumber: false
	}
): P {
	const { revertNumber } = option;
	const i = url.indexOf('?');
	const params: any = {};
	let paramsStr = i < 0 ? `?${url}` : url.slice(i);
	paramsStr = decodeURI(paramsStr);
	return (paramsStr.match(/[&?][^&?]+/g) || [])
		.map(str => str.replace(/^[&?]/, ''))
		.reduce((pre, cur) => {
			let [key, value] = cur.split('=');
			if (value && revertNumber && numberValueRegExp.test(value)) {
				value = Number(value) as any;
			}
			key && (pre[key] = value || true);
			return pre;
		}, params);
}

export function getUrlSingleParam<P = any>(
	url: string,
	key: string,
	option: UrlParamsOption = {
		revertNumber: false
	}
): P {
	const { revertNumber } = option;
	const i = url.indexOf('?');
	let paramsStr = i < 0 ? `?${url}` : url.slice(i);
	paramsStr = decodeURI(paramsStr);
	let match = paramsStr.match(new RegExp(`[?&]${str2reg(key)}([^&]*)`));
	if (!match) {
		return undefined as any;
	} else {
		let value: any = match[1];
		if (value) {
			value = String(value).replace(/^=/, '');
		} else {
			return true as any;
		}
		if (revertNumber && numberValueRegExp.test(value)) {
			value = Number(value);
		}
		return value;
	}
}

/**
 * 防抖节流
 * @param {*} action 回调
 * @param {*} delay 等待的时间
 * @param {*} context this指针
 * @param {Boolean} isElapsed true为节流，false为防抖
 * @returns {Function}
 */
export function throttle<F extends Function>(
	action: F,
	delay: number,
	context: any = null,
	isElapsed: boolean = false
): (...args: any[]) => any {
	let timeout: NodeJS.Timeout | null = null;
	let lastRun = 0;
	return function() {
		if (timeout) {
			if (isElapsed) {
				return;
			} else {
				clearTimeout(timeout);
				timeout = null;
			}
		}
		let elapsed = Date.now() - lastRun;
		let args = arguments;
		if (isElapsed && elapsed >= delay) {
			runCallback();
		} else {
			timeout = setTimeout(runCallback, delay);
		}
		function runCallback() {
			lastRun = Date.now();
			timeout = null;
			action.apply(context, args);
		}
	};
}
