import type { Type } from ".";

interface IReflectStore {
	Store: Map<string, Type>;
	Types: Type[];
	TypesByProjectName: Map<string, Type[]>;
	Assemblies: string[];
	AssembliesSet: Set<string>;
}

const ReflectStoreTemplate: IReflectStore = {
	Store: new Map<string, Type>(),
	Assemblies: [],
	AssembliesSet: new Set(),
	Types: [],
	TypesByProjectName: new Map<string, Type[]>(),
};

const KEY = "__REFLECT_STORE";
export const GlobalContext = _G as Record<string, unknown>;
export const ReflectStore = (GlobalContext[KEY] as IReflectStore) ?? ReflectStoreTemplate;
GlobalContext[KEY] = ReflectStore;
