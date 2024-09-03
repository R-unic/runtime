/** @hidden */
export class IType {
	readonly Name!: string;
	readonly FullName!: string;
	readonly Namespace!: string;
	readonly BaseType?: Type;
	readonly Value?: unknown;
	readonly Constructor?: ConstructorInfo;
	readonly Interfaces!: Type[];
	readonly Properties!: Property[];
	readonly Methods!: Method[];
	readonly Kind!: TypeKind;
}

export class Type extends IType {
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
}

export function ConvertTypeDescriptorInClass(descriptor: IType): Type {
	setmetatable(descriptor, Type as never);
	return descriptor as Type;
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
	readonly AccessModifier!: number;
	readonly IsStatic!: boolean;
	readonly IsAbstract!: boolean;
	readonly Callback?: (context: unknown, ...args: unknown[]) => unknown;
}

export class Parameter {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
}

export class Property {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
	readonly AccessModifier!: number;
	//readonly accessor: Accessor;
	readonly Readonly!: boolean;
}

export class ConstructorInfo {
	readonly Parameters!: Parameter[];
	readonly AccessModifier!: number;
	readonly Callback?: (...args: unknown[]) => unknown;
}
