import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import WorkspaceTiles from "./components/WorkspaceTiles";
import { IWorkspaceTilesProps } from "./components/IWorkspaceTilesProps";

export interface IWorkspaceTilesWebPartProps {
  siteUrl: string;
  listTitle: string;
  erpBaseUrl: string;
  invoiceBaseUrl: string;
  psaBaseUrl: string;
}

export default class WorkspaceTilesWebPart extends BaseClientSideWebPart<IWorkspaceTilesWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IWorkspaceTilesProps> = React.createElement(
      WorkspaceTiles,
      {
        context: this.context,
        siteUrl: this.properties.siteUrl || this.context.pageContext.web.absoluteUrl,
        listTitle: this.properties.listTitle || "Workspaces",
        erpBaseUrl: this.properties.erpBaseUrl || "",
        invoiceBaseUrl: this.properties.invoiceBaseUrl || "",
        psaBaseUrl: this.properties.psaBaseUrl || ""
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: "Einstellungen fuer das Workspace-Tiles-Webpart" },
        groups: [
          {
            groupName: "Datenquelle",
            groupFields: [
              PropertyPaneTextField("siteUrl", {
                label: "Site URL (absolut)",
                description: "URL der SharePoint-Site mit der Workspaces-Liste"
              }),
              PropertyPaneTextField("listTitle", {
                label: "Listenname",
                description: "Anzeigename der SharePoint-Liste"
              })
            ]
          },
          {
            groupName: "Externe Systeme (optional)",
            groupFields: [
              PropertyPaneTextField("erpBaseUrl", {
                label: "ERP-URL-Template",
                description: "Platzhalter {id} wird durch die Kundennummer ersetzt. Leer lassen zum Ausblenden."
              }),
              PropertyPaneTextField("invoiceBaseUrl", {
                label: "Rechnungs-URL-Template",
                description: "Platzhalter {id} wird durch die Kundennummer ersetzt."
              }),
              PropertyPaneTextField("psaBaseUrl", {
                label: "PSA-URL-Template",
                description: "Platzhalter {id} wird durch die Kundennummer ersetzt."
              })
            ]
          }
        ]
      }]
    };
  }
}
