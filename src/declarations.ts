export class Type {
	public readonly Name!: string;
	public readonly FullName!: string;
	public readonly Interfaces!: Type[];
	public readonly Properties!: Property[];
}

export class Property {
	readonly Name!: string;
	readonly Type!: Type;
	readonly Optional!: boolean;
	readonly AccessModifier!: number;
	//readonly accessor: Accessor;
	readonly Readonly!: boolean;
}
