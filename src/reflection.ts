import { Type } from "./declarations";
import { Metadata } from "./metadata";

const store = new Map<string, Type>();
const dataTypes = new Map<unknown, string>();
const globalContext = _G as Record<string, unknown>;
const GENERIC_PARAMETERS = "__GENERIC_PARAMETERS__";
const metadataTypeReference = "__TYPE_REFERENSE__";

const UNKNOWN_TYPE: Type = {
	Name: "unknown",
	FullName: "unknown",
	BaseType: undefined,
	Interfaces: [],
	Properties: [],
	Methods: [],
};

export function RegisterType(name: string, _type: Type) {
	store.set(name, _type);
}

export function RegisterDataType(instance: object, name: string) {
	Metadata.defineMetadata(instance, metadataTypeReference, name);
}

/** @internal @hidden */
export function SetupGenericParameters() {}

export function GetType<T>(instance?: T): Type {
	let _type: Type | undefined;

	if (typeIs(instance, "string")) {
		_type = store.get(instance);
	}

	if (typeIs(instance, "table")) {
		_type = store.get(Metadata.getMetadata(instance, metadataTypeReference) ?? "__UNKNOWN__");
	}

	if (!_type) {
		return UNKNOWN_TYPE;
	}

	return _type;
}

/** @internal */
export function GetMethodCallback(ctor: object, methodName: string) {
	const casted = ctor as Record<string, (context: unknown, ...args: unknown[]) => unknown>;
	return casted[methodName];
}

/** @internal */
export function GetConstructorCallback(ctor: object) {
	const casted = ctor as Record<string, (...args: unknown[]) => unknown>;
	return casted["constructor"];
}
