/* eslint-disable @typescript-eslint/no-explicit-any */

import { AttributeMarker } from "./public-api";

export type Constructor<T = object> = new (...args: never[]) => T;
export type AttributeKind = "class" | "method" | "property" | "parameter";
let imported: typeof import("./internal-usage") | undefined;

function ImportInternalApi() {
	if (imported) return imported;
	imported = import("./internal-usage").expect();

	return imported;
}

export class Attribute {
	/** @hidden */
	public Attributes: object[] = [];
	/** @hidden */
	public AttributesById = new Map<string, object>();

	public GetAttributes() {
		return this.Attributes;
	}

	/** @AttributeAPI */
	public static Is<T extends AttributeMarker<any>>(attributeData: unknown): attributeData is T["__instance"] {
		const attributeId = ImportInternalApi().GetGenericParameters()[0];
		const casted = attributeData as Record<string, unknown>;
		if (casted["__id"] === undefined) return false;

		return casted["__id"] === attributeId;
	}

	private findAttributeInherit<T extends AttributeMarker<any>>(attributeId: string) {
		if (!(this instanceof Type)) return;

		let parent = this.BaseType;
		while (parent) {
			const attribute = parent.getAttribute<T>(attributeId);
			if (attribute) {
				return attribute as T;
			}
			parent = parent.BaseType;
		}
	}

	private getAttribute<T extends AttributeMarker<any>>(attributeId: string) {
		return this.AttributesById.get(attributeId) as T["__instance"] | undefined;
	}

	/** @AttributeAPI */
	public GetAttribute<T extends AttributeMarker<any>>(inherit = false) {
		const attributeId = ImportInternalApi().GetGenericParameters()[0];
		if (!attributeId) {
			throw "Attribute id is not set";
		}

		if (inherit) {
			const attribute = this.findAttributeInherit(attributeId);
			if (attribute) return attribute as T["__instance"];
		}

		return this.getAttribute<T>(attributeId) as T["__instance"] | undefined;
	}

	/** @AttributeAPI */
	public HaveAttribute<T extends AttributeMarker<any>>(inherit = false) {
		const attributeId = ImportInternalApi().GetGenericParameters()[0];
		if (!attributeId) {
			throw "Attribute id is not set";
		}

		if (inherit) {
			const attribute = this.findAttributeInherit(attributeId);
			if (attribute) return true;
		}

		return this.getAttribute<T>(attributeId) !== undefined;
	}
}

export class Type extends Attribute {
	public readonly Name!: string;
	public readonly FullName!: string;
	public readonly Assembly!: string;
	public readonly BaseType?: Type;
	public readonly Value?: unknown;
	public readonly Constructor?: ConstructorInfo;
	public readonly Interfaces!: ReadonlyArray<Type>;
	public readonly Properties!: ReadonlyArray<Attribute & Property>;
	public readonly Methods!: ReadonlyArray<Attribute & Method>;
	public readonly Kind!: TypeKind;

	private mapProperties = new Map<string, Property>();
	private mapMethods = new Map<string, Method>();

	constructor() {
		super();

		this.Properties.forEach((property) => {
			this.mapProperties.set(property.Name, property);
		});

		this.Methods.forEach((method) => {
			this.mapMethods.set(method.Name, method);
		});

		if (this.BaseType) {
			this.BaseType.Properties.forEach((property) => {
				this.mapProperties.set(property.Name, property);
			});

			this.BaseType.Methods.forEach((method) => {
				this.mapMethods.set(method.Name, method);
			});
		}

		(this.Properties as unknown as Property[]).clear();
		(this.Methods as unknown as Method[]).clear();

		this.mapProperties.forEach((property) => {
			(this.Properties as unknown as Property[]).push(property);
		});

		this.mapMethods.forEach((method) => {
			(this.Methods as unknown as Method[]).push(method);
		});
	}

	public IsInterface() {
		return this.Kind === TypeKind.Interface;
	}

	public IsClass() {
		return this.Kind === TypeKind.Class;
	}

	public IsObject() {
		return this.Kind === TypeKind.Object;
	}

	public IsTypeParameter() {
		return this.Kind === TypeKind.TypeParameter;
	}

	public IsEnum() {
		return this.Kind === TypeKind.Enum;
	}

	public IsPrimitive() {
		return this.Kind === TypeKind.Primitive;
	}

	public GetProperty(name: string) {
		return this.mapProperties.get(name);
	}

	public GetMethod(name: string) {
		return this.mapMethods.get(name);
	}
}

const mt = getmetatable(Type) as { __index?: object };
mt.__index = Attribute;

export function WithAttributeProvider(instance: object, setMT = true) {
	const template = new Attribute();

	for (const [key, value] of pairs(template)) {
		(instance as Record<string, unknown>)[key] = value;
	}

	setMT && setmetatable(instance, Attribute as never);
	return instance as Attribute;
}

export function GetDeferredConstructor<T extends object>(ctor: Constructor<T>) {
	const obj = setmetatable({}, ctor as never) as T;

	return [
		obj,
		(...args: ConstructorParameters<Constructor<T>>) => {
			(obj as { "constructor"(...args: unknown[]): unknown }).constructor(...args);
		},
	] as const;
}

export function ConvertTypeDescriptorInClass(descriptor: object): Type {
	const [template, ctor] = GetDeferredConstructor(Type);

	for (const [key, value] of pairs(descriptor as Record<string, unknown>)) {
		(template as unknown as Record<string, unknown>)[key] = value;
	}

	template.Properties.forEach((property) => {
		WithAttributeProvider(property);
	});

	template.Methods.forEach((method) => {
		WithAttributeProvider(method);
	});

	ctor();

	return template;
}

export enum AccessModifier {
	Private = 0,
	Protected = 1,
	Public = 2,
}

export enum TypeKind {
	Unknown = 0,
	Primitive = 1,
	Interface = 2,
	Class = 3,
	Object = 4,
	TypeParameter = 5,
	Enum = 6,
}

export class Method {
	readonly Name!: string;
	readonly ReturnType!: Type;
	readonly Parameters!: Parameter[];
	readonly AccessModifier!: AccessModifier;
	readonly IsStatic!: boolean;
	readonly IsAbstract!: boolean;
	readonly Callback?: (context: unknown, ...args: unknown[]) => unknown;
}

export class Parameter extends Attribute {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
}

export class Property {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
	readonly AccessModifier!: AccessModifier;
	readonly Readonly!: boolean;
}

export class ConstructorInfo {
	readonly Parameters!: Parameter[];
	readonly AccessModifier!: AccessModifier;
	readonly Callback?: (...args: unknown[]) => unknown;
}
