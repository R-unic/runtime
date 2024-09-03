import { ConvertTypeDescriptorInClass, IType, Type, TypeKind } from "./declarations";
import { Metadata } from "./metadata";

interface IReflectStore {
	Store: Map<string, Type>;
	Types: Type[];
	TypesByProjectName: Map<string, Type[]>;
	Namespaces: string[];
	NamespacesSet: Set<string>;
}

const ReflectStoreTemplate: IReflectStore = {
	Store: new Map<string, Type>(),
	Namespaces: [],
	NamespacesSet: new Set(),
	Types: [],
	TypesByProjectName: new Map<string, Type[]>(),
};

const KEY = "__REFLECT_STORE";
const globalContext = _G as Record<string, unknown>;
const reflectStore = (globalContext[KEY] as IReflectStore) ?? ReflectStoreTemplate;
globalContext[KEY] = reflectStore;

const GENERIC_PARAMETERS = "__GENERIC_PARAMETERS__";
const metadataTypeReference = "__TYPE_REFERENSE__";

const UNKNOWN_TYPE = ConvertTypeDescriptorInClass({
	Name: "unknown",
	FullName: "unknown",
	Namespace: "unknown",
	BaseType: undefined,
	Interfaces: [],
	Properties: [],
	Methods: [],
	Kind: TypeKind.Unknown,
});

export const CurrentNamespace = { _special: "CurrentNamespace" as const };

export function GetAllTypes() {
	return reflectStore.Types as ReadonlyArray<Type>;
}

export function GetAllNamespaces() {
	return reflectStore.Namespaces as ReadonlyArray<string>;
}

export function GetTypes(namespace: string | typeof CurrentNamespace) {
	if (namespace === CurrentNamespace) {
		throw "Transformer missing CurrentNamespace marker";
	}

	return (reflectStore.TypesByProjectName.get(namespace as string) as ReadonlyArray<Type>) ?? [];
}

export function RegisterType(_typeRef: IType) {
	if (reflectStore.Store.has(_typeRef.FullName)) return;
	const _type = ConvertTypeDescriptorInClass(_typeRef);

	const types = reflectStore.TypesByProjectName.get(_type.FullName) ?? [];
	reflectStore.TypesByProjectName.set(_type.Namespace, types);

	if (!reflectStore.NamespacesSet.has(_type.Namespace)) {
		reflectStore.Namespaces.push(_type.Namespace);
		reflectStore.NamespacesSet.add(_type.Namespace);
	}

	types.push(_type);
	reflectStore.Types.push(_type);
	reflectStore.Store.set(_type.FullName, _type);
}

export function RegisterTypes(...args: IType[]) {
	args.forEach(RegisterType);
}

export function RegisterDataType(instance: object, name: string) {
	Metadata.defineMetadata(instance, metadataTypeReference, name);
}

/** @internal @hidden */
export function SetupGenericParameters(params: string[]) {
	globalContext[GENERIC_PARAMETERS] = params;
}

/** @internal @hidden */
export function SetupDefaultGenericParameters(defined: string[], params: [number, string][]) {
	params.forEach(([index, id]) => {
		if (defined[index] !== undefined) return;
		defined[index] = id;
	});
}

/** @internal @hidden */
export function GetGenericParameters() {
	const result = globalContext[GENERIC_PARAMETERS] as string[];
	globalContext[GENERIC_PARAMETERS] = undefined;

	return result;
}

export function GetType<T>(instance?: T): Type {
	let _type: Type | undefined;

	if (typeIs(instance, "string")) {
		_type = reflectStore.Store.get(instance);
	}

	if (typeIs(instance, "table")) {
		_type = reflectStore.Store.get(Metadata.getMetadata(instance, metadataTypeReference) ?? "__UNKNOWN__");
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
