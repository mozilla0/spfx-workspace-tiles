import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFI, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IWorkspace } from "../models/IWorkspace";

export class WorkspaceService {
  private sp: SPFI;
  private listTitle: string;

  constructor(context: WebPartContext, siteUrl: string, listTitle: string) {
    this.listTitle = listTitle;
    this.sp = spfi(siteUrl).using(SPFx(context));
  }

  public async getWorkspaces(): Promise<IWorkspace[]> {
    // Owner ist ein Person/Group-Feld (Multi-User moeglich) -> muss expandiert werden.
    // ACHTUNG: bei Multi-Person kann EMail nicht direkt projektiert werden
    // ("Cannot get value for projected field Owner_EMail" Fehler).
    // Stattdessen holen wir Title + Name (LoginName, enthaelt i.d.R. die Email
    // bzw. den UPN nach dem |-Trenner).
    const items = await this.sp.web.lists
      .getByTitle(this.listTitle)
      .items
      .select(
        "Id",
        "Title",
        "Alias",
        "Kategorie",
        "Owner/Title",
        "Owner/Name",
        "Visibility",
        "Url",
        "Status",
        "Created"
      )
      .expand("Owner")
      .top(5000)();

    return items.map((item: any) => {
      // Email kommt aus LoginName (Name-Property), Format:
      // "i:0#.f|membership|user@domain.ch" -> wir nehmen den Teil nach dem letzten "|"
      const extractEmail = (loginName: string): string => {
        if (!loginName) return "";
        const parts = loginName.split("|");
        const candidate = parts[parts.length - 1];
        return candidate.indexOf("@") > -1 ? candidate : "";
      };

      let owners: { name: string; email: string }[] = [];
      if (Array.isArray(item.Owner)) {
        owners = item.Owner
          .map((o: any) => ({
            name: o?.Title ?? "",
            email: extractEmail(o?.Name ?? "")
          }))
          .filter((o: any) => o.name);
      } else if (item.Owner && typeof item.Owner === "object") {
        if (item.Owner.Title) {
          owners = [{
            name: item.Owner.Title,
            email: extractEmail(item.Owner.Name ?? "")
          }];
        }
      } else if (typeof item.Owner === "string" && item.Owner) {
        owners = [{ name: item.Owner, email: "" }];
      }

      // Url ist Hyperlink: { Url: "...", Description: "..." }
      let urlValue = "";
      if (item.Url && typeof item.Url === "object") {
        urlValue = item.Url.Url ?? "";
      } else if (typeof item.Url === "string") {
        urlValue = item.Url;
      }

      return {
        Id: item.Id,
        Title: item.Title ?? "",
        Alias: item.Alias ?? "",
        Kategorie: item.Kategorie ?? "Intern",
        Owners: owners,
        Visibility: item.Visibility ?? "Private",
        Url: urlValue,
        Status: item.Status ?? "",
        Created: item.Created ?? ""
      };
    });
  }
}
