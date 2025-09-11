
export interface Slide {
  id: string;
  title: string;
  content: string;
  extracts?: Slide[];
  status: 'draft' | 'complete' | 'needs review';
}

export interface Novel {
  title: string;
  slides: Slide[];
}
