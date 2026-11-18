export interface IOwner {
  name: string;
  email: string;
}

export interface IWorkspace {
  Id: number;
  Title: string;
  Alias: string;
  Kategorie: string;
  Owners: IOwner[];
  Visibility: string;
  Url: string;
  Status: string;
  Created: string;
}

export type CategoryFilter = string;
export type VisibilityFilter = "all" | "Public" | "Private";
export type SortMode = "title-asc" | "title-desc" | "alias-asc" | "alias-desc" | "created-desc";
