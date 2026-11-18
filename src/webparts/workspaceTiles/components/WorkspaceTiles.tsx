import * as React from "react";
import styles from "./WorkspaceTiles.module.scss";
import { IWorkspaceTilesProps } from "./IWorkspaceTilesProps";
import { IWorkspace, CategoryFilter, VisibilityFilter, SortMode } from "../models/IWorkspace";
import { WorkspaceService } from "../services/WorkspaceService";
import { PersonaStack } from "./PersonaStack";
import { SearchBox, Dropdown, IDropdownOption, Spinner, SpinnerSize } from "@fluentui/react";

interface IState {
  workspaces: IWorkspace[];
  loading: boolean;
  error: string | undefined;
  search: string;
  category: CategoryFilter;
  visibility: VisibilityFilter;
  sort: SortMode;
}

export default class WorkspaceTiles extends React.Component<IWorkspaceTilesProps, IState> {
  constructor(props: IWorkspaceTilesProps) {
    super(props);
    this.state = {
      workspaces: [],
      loading: true,
      error: undefined,
      search: "",
      category: "all",
      visibility: "all",
      sort: "title-asc"
    };
  }

  public componentDidMount(): void {
    this.loadData();
  }

  public componentDidUpdate(prev: IWorkspaceTilesProps): void {
    if (prev.siteUrl !== this.props.siteUrl || prev.listTitle !== this.props.listTitle) {
      this.loadData();
    }
  }

  private async loadData(): Promise<void> {
    this.setState({ loading: true, error: undefined });
    try {
      const service = new WorkspaceService(this.props.context, this.props.siteUrl, this.props.listTitle);
      const data = await service.getWorkspaces();
      this.setState({ workspaces: data, loading: false });
    } catch (err) {
      console.error("[WorkspaceTiles] load failed", err);
      this.setState({
        loading: false,
        error: `Daten konnten nicht geladen werden: ${err.message ?? err}`
      });
    }
  }

  /**
   * Normalisiert den Alias zu einer Kundennummer mit CUS-Prefix.
   * Wird nur bei Kategorie=Kunde aufgerufen.
   * - "CUS-10565" -> "CUS-10565"
   * - "10468"     -> "CUS-10468"
   * - alles andere -> undefined
   */
  private toCustomerId(alias: string): string | undefined {
    if (!alias) return undefined;
    const trimmed = alias.trim();
    if (/^CUS-\d+$/i.test(trimmed)) return trimmed.toUpperCase();
    if (/^\d{4,6}$/.test(trimmed)) return `CUS-${trimmed}`;
    return undefined;
  }

  /**
   * Liefert eine deterministische Farbe fuer eine Kategorie.
   * Bekannte Kategorien haben feste Farben; unbekannte bekommen
   * eine reproduzierbare Farbe aus der Palette (Hash ueber den String).
   */
  private getCategoryColor(kategorie: string): { accent: string; label: string } {
    const k = (kategorie || "").toLowerCase().trim();
    const known: { [key: string]: { accent: string; label: string } } = {
      "kunde":   { accent: "#378ADD", label: "#185fa5" },
      "intern":  { accent: "#1D9E75", label: "#0f6e56" },
      "projekt": { accent: "#EF9F27", label: "#854f0b" }
    };
    if (known[k]) return known[k];

    const palette: { accent: string; label: string }[] = [
      { accent: "#9461C9", label: "#5d3a8a" },
      { accent: "#D9596E", label: "#a02e44" },
      { accent: "#4DB6AC", label: "#26766c" },
      { accent: "#7C8DAB", label: "#445573" },
      { accent: "#C97D4D", label: "#7d4a26" },
      { accent: "#5B8FB9", label: "#2f5d80" }
    ];
    let h = 0;
    for (let i = 0; i < k.length; i++) {
      h = ((h * 31) + k.charCodeAt(i)) | 0;
    }
    return palette[Math.abs(h) % palette.length];
  }

  private getAvailableCategories(items: IWorkspace[]): string[] {
    const seen: { [key: string]: boolean } = {};
    const all: string[] = [];
    items.forEach(w => {
      const k = (w.Kategorie || "").trim();
      if (k && !seen[k.toLowerCase()]) {
        seen[k.toLowerCase()] = true;
        all.push(k);
      }
    });
    const known = ["Kunde", "Intern", "Projekt"];
    const knownInData = known.filter(k => all.some((a: string) => a.toLowerCase() === k.toLowerCase()));
    const unknown = all
      .filter((a: string) => !known.some(k => k.toLowerCase() === a.toLowerCase()))
      .sort((a: string, b: string) => a.localeCompare(b, "de-CH"));
    return [...knownInData, ...unknown];
  }

  private filter(items: IWorkspace[]): IWorkspace[] {
    const { search, category, visibility } = this.state;
    const q = search.trim().toLowerCase();

    return items.filter(w => {
      if (category !== "all" && (w.Kategorie || "").toLowerCase() !== category.toLowerCase()) return false;
      if (visibility !== "all" && w.Visibility !== visibility) return false;
      if (q) {
        const ownerNames = (w.Owners || []).map(o => o.name).join(" ");
        const hay = `${w.Title} ${w.Alias} ${ownerNames}`.toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  private aliasToNumber(alias: string): number {
    if (!alias) return NaN;
    const match = alias.trim().match(/^(?:CUS-)?(\d+)$/i);
    return match ? parseInt(match[1], 10) : NaN;
  }

  private sort(items: IWorkspace[]): IWorkspace[] {
    const { sort } = this.state;
    const arr = items.slice();
    const collator = new Intl.Collator("de-CH", { sensitivity: "base", numeric: true });

    switch (sort) {
      case "title-asc":
        arr.sort((a, b) => collator.compare(a.Title, b.Title));
        break;
      case "title-desc":
        arr.sort((a, b) => collator.compare(b.Title, a.Title));
        break;
      case "alias-asc":
      case "alias-desc": {
        const dir = sort === "alias-asc" ? 1 : -1;
        arr.sort((a, b) => {
          const na = this.aliasToNumber(a.Alias);
          const nb = this.aliasToNumber(b.Alias);
          const aIs = !isNaN(na);
          const bIs = !isNaN(nb);
          if (aIs && bIs) return (na - nb) * dir;
          if (aIs) return -1;
          if (bIs) return 1;
          return collator.compare(a.Alias, b.Alias) * dir;
        });
        break;
      }
      case "created-desc":
        arr.sort((a, b) => (b.Created || "").localeCompare(a.Created || ""));
        break;
    }
    return arr;
  }

  public render(): React.ReactElement<IWorkspaceTilesProps> {
    const { loading, error, workspaces, search, category, visibility, sort } = this.state;

    if (loading) {
      return (
        <div className={styles.workspaceTiles}>
          <div className={styles.loading}>
            <Spinner size={SpinnerSize.medium} label="Workspaces werden geladen..." />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.workspaceTiles}>
          <div className={styles.error}>{error}</div>
        </div>
      );
    }

    const filtered = this.sort(this.filter(workspaces));

    const availableCategories = this.getAvailableCategories(workspaces);
    const categoryOptions: IDropdownOption[] = [
      { key: "all", text: "Alle Kategorien" },
      ...availableCategories.map(c => ({ key: c, text: c }))
    ];

    const visibilityOptions: IDropdownOption[] = [
      { key: "all", text: "Alle Sichtbarkeiten" },
      { key: "Public", text: "Public" },
      { key: "Private", text: "Private" }
    ];

    const sortOptions: IDropdownOption[] = [
      { key: "title-asc",    text: "Name A → Z" },
      { key: "title-desc",   text: "Name Z → A" },
      { key: "alias-asc",    text: "Kundennummer aufsteigend" },
      { key: "alias-desc",   text: "Kundennummer absteigend" },
      { key: "created-desc", text: "Neuste zuerst" }
    ];

    const total = workspaces.length;
    const kunden = workspaces.filter(w => (w.Kategorie || "").toLowerCase() === "kunde").length;
    const pub = workspaces.filter(w => w.Visibility === "Public").length;
    const priv = workspaces.filter(w => w.Visibility === "Private").length;

    const { erpBaseUrl, invoiceBaseUrl, psaBaseUrl } = this.props;

    return (
      <div className={styles.workspaceTiles}>

        <div className={styles.header}>
          <div className={styles.searchBox}>
            <SearchBox
              placeholder="Workspace suchen..."
              value={search}
              onChange={(_, v) => this.setState({ search: v ?? "" })}
            />
          </div>
          <Dropdown
            className={styles.filter}
            selectedKey={category}
            options={categoryOptions}
            onChange={(_, opt) => this.setState({ category: opt?.key as CategoryFilter })}
          />
          <Dropdown
            className={styles.filter}
            selectedKey={visibility}
            options={visibilityOptions}
            onChange={(_, opt) => this.setState({ visibility: opt?.key as VisibilityFilter })}
          />
          <Dropdown
            className={styles.sortDropdown}
            selectedKey={sort}
            options={sortOptions}
            onChange={(_, opt) => this.setState({ sort: opt?.key as SortMode })}
          />
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statValue}>{total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Kunden</div>
            <div className={styles.statValue}>{kunden}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Public</div>
            <div className={styles.statValue}>{pub}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Private</div>
            <div className={styles.statValue}>{priv}</div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>Keine Workspaces gefunden</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(w => {
              const isPublic = w.Visibility === "Public";
              const isActive = (w.Status || "").toLowerCase() === "aktiv";
              const isKunde = (w.Kategorie || "").toLowerCase() === "kunde";
              const customerId = isKunde ? this.toCustomerId(w.Alias) : undefined;
              const catColor = this.getCategoryColor(w.Kategorie);

              const stopProp = (e: React.MouseEvent): void => {
                e.stopPropagation();
              };

              const showActions = customerId && (erpBaseUrl || invoiceBaseUrl || psaBaseUrl);

              return (
                <a
                  key={w.Id}
                  className={styles.tile}
                  href={w.Url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={styles.accent} style={{ background: catColor.accent }} />

                  <div className={styles.titleRow}>
                    <div className={styles.title} title={w.Title}>{w.Title}</div>
                    <div className={styles.titleRight}>
                      <div className={`${styles.badge} ${isPublic ? styles.badgePublic : styles.badgePrivate}`}>
                        {w.Visibility}
                      </div>
                      <PersonaStack
                        owners={w.Owners}
                        siteUrl={this.props.siteUrl}
                        maxVisible={3}
                      />
                    </div>
                  </div>

                  <div className={styles.alias} title={w.Alias}>{w.Alias}</div>

                  {showActions && (
                    <div className={styles.actions}>
                      {erpBaseUrl && (
                        <a
                          className={styles.actionBtn}
                          href={erpBaseUrl.replace("{id}", customerId!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="ERP-Kundenseite"
                          onClick={stopProp}
                        >
                          <i className="ms-Icon ms-Icon--ContactCard" aria-hidden="true" />
                          <span>ERP</span>
                        </a>
                      )}
                      {invoiceBaseUrl && (
                        <a
                          className={styles.actionBtn}
                          href={invoiceBaseUrl.replace("{id}", customerId!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Rechnungen"
                          onClick={stopProp}
                        >
                          <i className="ms-Icon ms-Icon--Money" aria-hidden="true" />
                          <span>Rechnungen</span>
                        </a>
                      )}
                      {psaBaseUrl && (
                        <a
                          className={styles.actionBtn}
                          href={psaBaseUrl.replace("{id}", customerId!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="PSA"
                          onClick={stopProp}
                        >
                          <i className="ms-Icon ms-Icon--Headset" aria-hidden="true" />
                          <span>PSA</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className={styles.footer}>
                    <div className={styles.categoryLabel} style={{ color: catColor.label }}>
                      {w.Kategorie}
                    </div>
                    <div className={styles.statusWrap}>
                      <span className={`${styles.statusDot} ${isActive ? styles.statusActive : styles.statusOther}`}>
                        {isActive ? "●" : "○"}
                      </span>
                      <span>{w.Status}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

      </div>
    );
  }
}
