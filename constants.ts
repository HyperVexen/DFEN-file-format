import type { Novel } from './types';

export const INITIAL_NOVEL: Novel = {
  title: "The Crimson Chronicles",
  slides: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Beginning',
      status: 'complete',
      content: `"Hello," she [b]whispered[/b] in the [color=rgb(250,150,150)]moonlight[/color]. The ancient manuscript was written in [font=Cinzel]barely legible in the dim light[/font]. She found the [bg=white][color=black]important passage[/color][/bg] highlighted in the old book. The chemical formula H[sub]2[/sub]O appeared next to E=mc[sup]2[/sup].`,
      extracts: [
        {
          id: 'extract-1-1',
          title: 'The Discovery',
          status: 'complete',
          content: 'The first clue was a small, almost insignificant detail. A misplaced book, a faint scent of ozone. [i]Something was wrong.[/i] The detective spoke in [font=Times New Roman]formal tones[/font].'
        },
        {
          id: 'extract-1-2',
          title: 'A New Lead',
          status: 'draft',
          content: 'The street kid replied with [font=Comic Sans MS]casual slang[/font], giving a description that opened up a new path in the investigation.'
        }
      ]
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: The Conspiracy',
      status: 'draft',
      content: 'She read the [u][b]warning label[/b][/u] carefully: "[color=red]DANGER: Contains [font=Courier New][size=14]toxic substances[/size][/font][/color]." This changed everything. The conspiracy was deeper than she could have ever imagined.'
    },
    {
        id: 'chapter-3',
        title: 'Chapter 3: The Confrontation',
        status: 'needs review',
        content: 'The final showdown took place under a stormy sky. Rain lashed down, mixing with the tears on her face. It was time to end this, once and for all.'
    }
  ]
};