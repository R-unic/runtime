import { Type } from "./type";

const store = new Map<string, Type>();
const dataTypes = new Map<unknown, string>();

export function RegisterType(name: string, _type: Type) {
	store.set(name, _type);
}

export function GetType<T>(instance: T): Type {
	let _type: Type | undefined;

	if (typeIs(instance, "string")) {
		_type = store.get(instance);
	}

	_type = _type ?? store.get(dataTypes.get(instance) ?? "");
	if (!_type) throw `Could not find type for ${instance}`;

	return _type;
}
