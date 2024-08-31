export class Type {
	public readonly Name!: string;
	public readonly FullName!: string;
	public readonly BaseType: Type | undefined;
	public readonly Interfaces!: Type[];
	public readonly Properties!: Property[];
	public readonly Methods!: Method[];
}

export class Method {
	readonly Name!: string;
	readonly ReturnType!: Type;
	readonly Parameters!: Type[];
	readonly AccessModifier!: number;
	readonly IsStatic!: boolean;
	readonly IsAbstract!: boolean;
	//readonly Callback!: (context: unknown, ...args: unknown[]) => unknown;
}

export class Property {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
	readonly AccessModifier!: number;
	//readonly accessor: Accessor;
	readonly Readonly!: boolean;
}
