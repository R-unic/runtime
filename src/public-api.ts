/* eslint-disable @typescript-eslint/no-explicit-any */
import { Attribute, AttributeKind, Constructor, Type, WithAttributeProvider } from "./declarations";
import { __GetType, ATTRIBUTE_KIND, ATTRIBUTE_PARAMETERS, metadataTypeReference, UNKNOWN_TYPE } from "./internal-usage";
import { Metadata } from "./metadata";
import { GlobalContext, ReflectStore } from "./store";

export const CurrentAssembly = { _special: "CurrentAssembly" as const };

export interface AttributeMarker<T extends Constructor> {
	(...params: ConstructorParameters<T>): (...args: any[]) => any;
	readonly __special: "AttributeMarker";
	readonly __instance: InstanceType<T>;
}

function GetPrimitiveTypeId(value: unknown) {
	if (typeIs(value, "table")) {
		return Metadata.getMetadata<string>(value, metadataTypeReference) ?? "__UNKNOWN__";
	}

	const name = typeOf(value);
	return `Primitive:${name}`;
}

export function GetAllTypes() {
	return ReflectStore.Types as ReadonlyArray<Type>;
}

export function GetAllAssemblies() {
	return ReflectStore.Assemblies as ReadonlyArray<string>;
}

export function GetTypes(assembly: string | typeof CurrentAssembly) {
	if (assembly === CurrentAssembly) {
		throw "Transformer missing CurrentAssembly marker";
	}

	return (ReflectStore.TypesByProjectName.get(assembly as string) as ReadonlyArray<Type>) ?? [];
}

export function GetType<T>(instance?: T): Type {
	let _type: Type | undefined;

	if (typeIs(instance, "string")) {
		_type = ReflectStore.Store.get(instance);
	}

	if (_type === undefined) {
		_type = ReflectStore.Store.get(GetPrimitiveTypeId(instance));
	}

	if (!_type) {
		return UNKNOWN_TYPE;
	}

	return _type;
}

function AddAttributeData(attributeInstance: Attribute, attributeId: string, data: Record<string, unknown>) {
	if (!(attributeInstance instanceof Attribute)) {
		WithAttributeProvider(attributeInstance);
	}

	data["__id"] = attributeId;

	attributeInstance.AttributesById.set(attributeId, data);
	attributeInstance.Attributes.push(data);
}

export function CreateAttribute<T extends Constructor>(attributeClass: T, attributeId?: string) {
	if (attributeId === undefined) {
		throw "Attribute id is not set";
	}

	const callableSignature = (t: unknown, ...params: ConstructorParameters<T>) => {
		const kind = GlobalContext[ATTRIBUTE_KIND] as AttributeKind;
		if (kind === undefined) throw "Attribute kind is not set";
		const additional = (GlobalContext[ATTRIBUTE_PARAMETERS] ?? []) as unknown[];

		return (ctor: object, ...args: unknown[]) => {
			const attr = new attributeClass(...params) as Record<string, unknown>;
			const _type = __GetType(ctor);

			if (kind === "class") {
				AddAttributeData(_type, attributeId, attr);
				return;
			}

			if (kind === "method") {
				const [methodName] = args as [string];
				const provider = _type.Methods.find((v) => v.Name === methodName);
				if (!provider) return;

				AddAttributeData(provider, attributeId, attr);
				return;
			}

			if (kind === "property") {
				const [propertyName] = args as [string];
				const provider = _type.Properties.find((v) => v.Name === propertyName);
				if (!provider) return;

				AddAttributeData(provider, attributeId, attr);
				return;
			}

			if (kind === "parameter") {
				const methodName = additional[0] as string;
				const [_, index] = args as [string, number];
				const provider = _type.Methods.find((v) => v.Name === methodName)?.Parameters[index];
				if (!provider) return;

				AddAttributeData(provider, attributeId, attr);
				return;
			}
		};
	};

	const mt = getmetatable(attributeClass) as { __call?: Callback };
	mt.__call = callableSignature;

	return attributeClass as AttributeMarker<T> & T;
}
