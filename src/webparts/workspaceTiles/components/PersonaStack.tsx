import * as React from "react";
import styles from "./WorkspaceTiles.module.scss";
import { IOwner } from "../models/IWorkspace";

export interface IPersonaStackProps {
  owners: IOwner[];
  siteUrl: string;
  maxVisible?: number;
}

interface IAvatarProps {
  owner: IOwner;
  siteUrl: string;
}

interface IAvatarState {
  failed: boolean;
}

class SingleAvatar extends React.Component<IAvatarProps, IAvatarState> {
  constructor(props: IAvatarProps) {
    super(props);
    this.state = { failed: false };
  }

  private getInitials(name: string): string {
    if (!name) return "—";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  private onError = (): void => {
    this.setState({ failed: true });
  };

  public render(): React.ReactElement<IAvatarProps> {
    const { owner, siteUrl } = this.props;
    const showPhoto = !this.state.failed && !!owner.email;

    if (!showPhoto) {
      return (
        <div className={styles.avatar} title={owner.name}>
          {this.getInitials(owner.name)}
        </div>
      );
    }

    const photoUrl = `${siteUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(owner.email)}`;

    return (
      <img
        className={styles.avatarImg}
        src={photoUrl}
        alt={owner.name}
        title={owner.name}
        onError={this.onError}
      />
    );
  }
}

export class PersonaStack extends React.Component<IPersonaStackProps> {
  public render(): React.ReactElement<IPersonaStackProps> {
    const { owners, siteUrl, maxVisible = 3 } = this.props;

    if (!owners || owners.length === 0) {
      return (
        <div className={styles.avatar} title="—">—</div>
      );
    }

    const visible = owners.slice(0, maxVisible);
    const overflow = owners.length - visible.length;
    const overflowNames = owners.slice(maxVisible).map(o => o.name).join(", ");

    return (
      <div className={styles.personaStack}>
        {visible.map((o, idx) => (
          <div key={`${o.email || o.name}-${idx}`} className={styles.personaStackItem}>
            <SingleAvatar owner={o} siteUrl={siteUrl} />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className={`${styles.personaStackItem} ${styles.avatarOverflow}`}
            title={overflowNames}
          >
            +{overflow}
          </div>
        )}
      </div>
    );
  }
}
