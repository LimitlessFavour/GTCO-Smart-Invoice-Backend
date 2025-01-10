export interface RequestContext {
  user: {
    id: string;
    company?: {
      id: number;
    };
  };
}
