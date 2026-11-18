import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IWorkspaceTilesProps {
  context: WebPartContext;
  siteUrl: string;
  listTitle: string;
  erpBaseUrl: string;
  invoiceBaseUrl: string;
  psaBaseUrl: string;
}
