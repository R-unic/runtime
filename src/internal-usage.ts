/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttributeKind, ConvertTypeDescriptorInClass, Type } from "./declarations";
import { Metadata } from "./metadata";
import { GlobalContext, ReflectStore } from "./store";

const GENERIC_PARAMETERS = "__GENERIC_PARAMETERS__";
export const ATTRIBUTE_KIND = "__ATTRIBUTE_KIND__";
export const ATTRIBUTE_PARAMETERS = "__ATTRIBUTE_PARAMETERS__";
export const metadataTypeReference = "__TYPE_REFERENSE__";

export function RegisterType(_typeRef: Type) {
	if (ReflectStore.Store.has(_typeRef.FullName)) return;
	const _type = ConvertTypeDescriptorInClass(_typeRef);

	const types = ReflectStore.TypesByProjectName.get(_type.Assembly) ?? [];
	ReflectStore.TypesByProjectName.set(_type.Assembly, types);

	if (!ReflectStore.AssembliesSet.has(_type.Assembly)) {
		ReflectStore.Assemblies.push(_type.Assembly);
		ReflectStore.AssembliesSet.add(_type.Assembly);
	}

	types.push(_type);
	ReflectStore.Types.push(_type);
	ReflectStore.Store.set(_type.FullName, _type);
}

/** @internal @hidden */
export function SetupKindForAttribute(kind: AttributeKind, additionalParams?: unknown[]) {
	GlobalContext[ATTRIBUTE_KIND] = kind;
	GlobalContext[ATTRIBUTE_PARAMETERS] = additionalParams;
}

export function RegisterTypes(...args: Type[]) {
	args.forEach(RegisterType);
}

export function RegisterDataType(instance: object, name: string) {
	Metadata.defineMetadata(instance, metadataTypeReference, name);
}

/** @internal @hidden */
export function SetupGenericParameters(params: string[]) {
	GlobalContext[GENERIC_PARAMETERS] = params;
}

/** @internal @hidden */
export function SetupDefaultGenericParameters(defined: string[], params: [number, string][]) {
	if (defined === undefined) return;

	params.forEach(([index, id]) => {
		if (defined[index] !== undefined) return;
		defined[index] = id;
	});
}

/** @internal @hidden */
export function GetGenericParameters() {
	const result = GlobalContext[GENERIC_PARAMETERS] as string[];
	GlobalContext[GENERIC_PARAMETERS] = undefined;

	return result ?? [];
}

let imported: typeof import("./public-api") | undefined;
function ImportPublicApi() {
	if (imported) return imported;
	imported = import("./public-api").expect();

	return imported;
}

/** @internal @hidden */
export function __GetType<T>(instance?: T): Type {
	return ImportPublicApi().GetType<T>(instance);
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
