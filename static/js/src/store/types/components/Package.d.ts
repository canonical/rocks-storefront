import type Publisher from "../../publisher-admin/types/components/Publisher";

type Package = {
  authority: string | null;
  contact: string | undefined;
  "default-track": string;
  description: string;
  id: string;
  links: {
    contact: Array<string>;
    website: Array<string>;
  };
  media: Array<{
    type: string;
    url: string;
  }>;
  name: string;
  private: boolean;
  publisher: Publisher;
  status: string;
  store: string;
  summary: string | null;
  title: string | null;
  "track-guardrails": Array<string>;
  tracks: Array<{
    "automatic-phasing-percentage": string | null;
    "created-at": string;
    name: string;
    "version-pattern": string | null;
  }>;
  type: string;
  website: string | null;
};

export default Package;
