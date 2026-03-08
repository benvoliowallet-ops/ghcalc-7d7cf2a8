
## Problém
Na riadku 317 v `VoraAIChat.tsx` sa `msg.content` renderuje ako čistý text (`{msg.content}`). AI odpovedá s markdown formátovaním (`**bold**`, číslované zoznamy, atď.), ale tieto sa zobrazujú doslovne vrátane hviezdičiek.

## Riešenie
Pridať jednoduchú funkciu `renderMarkdown` priamo v komponente, ktorá parsuje text a konvertuje:
- `**text**` → `<strong>text</strong>` (bold)
- `*text*` → `<em>text</em>` (italic)  
- Číslované zoznamy (`1. text`) → správne odsadenie

Namiesto `{msg.content}` použijeme `{renderMarkdown(msg.content)}` ktorá vráti pole React elementov (spans + strongs), pričom zachováme existujúce `whiteSpace: 'pre-wrap'`.

**Zmena len v jednom súbore: `src/components/VoraAIChat.tsx`**

Konkrétne:
1. Pridáme helper funkciu `renderContent(text: string): React.ReactNode` pred komponentom
2. Funkcia split-uje text po riadkoch, každý riadok parsuje pomocou regex pre `**...**` → `<strong>` a `*...*` → `<em>`
3. Na riadku 317 zmeníme `{msg.content}` na `{renderContent(msg.content)}`
4. Odstránime `whiteSpace: 'pre-wrap'` zo `style` keďže riadky budeme renderovať cez `<br/>` explicitne — alebo ho ponecháme a iba inlinové bold/italic parsujeme
