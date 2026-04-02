
export interface SemesterPrepData {
  semester: number;
  title: string;
  focus: string;
  concepts: { name: string; description: string }[];
  models: { name: string; description: string }[];
  examTips: string[];
  learningGoals: string[];
}

export const semesterPrepData: Record<number, SemesterPrepData> = {
  1: {
    semester: 1,
    title: "Indføring i Socialt Arbejde",
    focus: "Grundlæggende metoder, jura og rammerne for det sociale arbejde.",
    concepts: [
      { name: "Retssikkerhed", description: "Vigtigheden af at borgeren behandles korrekt ift. lovgivningen." },
      { name: "Magtanvendelse", description: "Hvornår og hvordan det offentlige må bruge tvang." },
      { name: "Social kontrol", description: "Mekanismer der regulerer individets adfærd i samfundet." }
    ],
    models: [
      { name: "Sagsbehandlingshjulet", description: "En systematisk model for sagsgangen fra ansøgning til afgørelse." },
      { name: "Livsverden vs. Systemverden", description: "Habermas' teori om konflikten mellem individets liv og systemets krav." }
    ],
    examTips: [
      "Fokusér på koblingen mellem teori og din case.",
      "Husk at henvise til de relevante paragraffer i Retssikkerhedsloven.",
      "Vær skarp på din rolle som myndighedsudøver."
    ],
    learningGoals: [
      "Kunne redegøre for de centrale værdier i socialt arbejde.",
      "Forstå opbygningen af det danske velfærdssystem.",
      "Kunne anvende grundlæggende juridisk metode."
    ]
  },
  2: {
    semester: 2,
    title: "Individet i Samfundet",
    focus: "Psykologi, sociologi og forståelsen af menneskets udvikling.",
    concepts: [
      { name: "Habitus", description: "Bourdieu's begreb om indlejrede vaner og dispositioner." },
      { name: "Tilknytningsmønstre", description: "Bowlbys teorier om barnets relation til omsorgsgivere." },
      { name: "Marginalisering", description: "Processen hvor individer skubbes ud i samfundets periferi." }
    ],
    models: [
      { name: "Bronfenbrenners bioøkologiske model", description: "Forståelse af barnet i forskellige systemer (mikro, meso, exo, makro)." },
      { name: "KASAM", description: "Antonovsky's model om følelsen af sammenhæng (Begribelighed, Håndterbarhed, Meningsfuldhed)." }
    ],
    examTips: [
      "Brug de psykologiske teorier til at forklare borgerens handlemønstre.",
      "Inddrag sociologiske perspektiver på ulighed.",
      "Vis hvordan teorierne kan bruges i en konkret socialfaglig vurdering."
    ],
    learningGoals: [
      "Kunne analysere menneskelig adfærd ud fra psykologiske teorier.",
      "Beskrive sociologiske årsager til sociale problemer.",
      "Forstå betydningen af inklusion og eksklusion."
    ]
  },
  3: {
    semester: 3,
    title: "Socialt Arbejde med Børn & Unge",
    focus: "Børne- og ungejura, foranstaltninger og tværfagligt samarbejde.",
    concepts: [
      { name: "Barnets Lov", description: "Den centrale lovgivning for støtte til børn og unge." },
      { name: "ICS (Integrated Children's System)", description: "Metode til systematisk undersøgelse af barnets behov." },
      { name: "Foranstaltningsviften", description: "De forskellige muligheder for hjælp (f.eks. kontaktperson, familiebehandling)." }
    ],
    models: [
      { name: "Søstjernemodellen", description: "Værktøj til at vurdere barnets trivsel på forskellige områder." },
      { name: "Den Motiverende Samtale (MI)", description: "Samtaleteknik til at fremme forandring." }
    ],
    examTips: [
      "Hav styr på 'Barnets plan' og de lovmæssige tidsfrister.",
      "Diskutér barnets inddragelse og ret til at blive hørt.",
      "Vær opmærksom på det tværfaglige samarbejde med skole og psykiatri."
    ],
    learningGoals: [
      "Anvende Barnets Lov i konkrete sagsforløb.",
      "Gennemføre børnefaglige undersøgelser.",
      "Vurdere behovet for anbringelse vs. forebyggende indsatser."
    ]
  },
  4: {
    semester: 4,
    title: "Beskæftigelse & Organisation",
    focus: "Arbejdsmarkedspolitik, beskæftigelsesindsats og organisatoriske rammer.",
    concepts: [
      { name: "Flexicurity", description: "Kombinationen af fleksibilitet på arbejdsmarkedet og social sikkerhed." },
      { name: "Empowerment", description: "At give borgeren magten over eget liv tilbage.",
      },
      { name: "New Public Management", description: "Styringsform i det offentlige med fokus på effektivitet og målstyring." }
    ],
    models: [
      { name: "Shermans model for ressourceforløb", description: "Vurdering af borgerens arbejdsevne." },
      { name: "BIPS (Beskæftigelse Indsats På Sygedagpengeområdet)", description: "Standardiseret indsatsmodel." }
    ],
    examTips: [
      "Diskutér balancen mellem støtte og kontrol i beskæftigelsessystemet.",
      "Inddrag viden om lov om aktiv beskæftigelsesindsats (LAB).",
      "Reflektér over de organisatoriske rammer for dit arbejde."
    ],
    learningGoals: [
        "Forstå sammenhængen mellem socialpolitik og arbejdsmarked.",
        "Mestre metoder til at bringe borgere tættere på arbejdsmarkedet.",
        "Kunne navigere i komplekse organisatoriske strukturer."
    ]
  },
  5: {
    semester: 5,
    title: "Psykiatri, Handicap & Misbrug",
    focus: "Målgrupper med komplekse udfordringer og speciallovgivning.",
    concepts: [
      { name: "Recovery", description: "Processen mod at leve et meningsfuldt liv trods psykisk sygdom." },
      { name: "Harm Reduction", description: "Skadesreduktion ved misbrug (f.eks. fixerum, substitutionsbehandling)." },
      { name: "Dobbelt-diagnose", description: "Samtidig forekomst af både psykisk lidelse og misbrug." }
    ],
    models: [
      { name: "Stress-Sårbarhedsmodellen", description: "Model til forståelse af udvikling og håndtering af psykisk sygdom." },
      { name: "VUM (Voksenudredningsmetoden)", description: "Metode til udredning af voksne med handicap eller sociale problemer." }
    ],
    examTips: [
      "Hav fokus på borgerens selvbestemmelse og etik.",
      "Brug VUM-modellen som struktur for din analyse.",
      "Diskutér betydningen af civilsamfundets roller (f.eks. væresteder)."
    ],
    learningGoals: [
      "Kunne differentiere mellem forskellige handicap- og psykiatrimålgrupper.",
      "Anvende servicelovens voksenbestemmelser.",
      "Handle etisk korrekt i svære professionelle dilemmaer."
    ]
  },
  6: {
    semester: 6,
    title: "Praktik & Profession",
    focus: "Refleksion over praksis, professionel identitet og metodeudvikling.",
    concepts: [
      { name: "Professionel dømmekraft", description: "Evnen til at handle klogt i situationer hvor reglerne ikke rækker." },
      { name: "Diskretionspligt", description: "Tavshedspligt og håndtering af personfølsomme oplysninger." },
      { name: "Tværfaglighed", description: "Samarbejde på tværs af faggrupper for at skabe helhedsløsninger." }
    ],
    models: [
      { name: "Schøns refleksionsmodel", description: "Refleksion-i-handling og refleksion-over-handling." },
      { name: "Kritiske hændelser", description: "Analyse af specifikke episoder fra praksis til læring." }
    ],
    examTips: [
      "Tag udgangspunkt i dine egne erfaringer fra praktikken.",
      "Husk at koble praksis-eksemplerne til relevant teori.",
      "Vær selvkritisk og reflektér over din egen udvikling som socialrådgiver."
    ],
    learningGoals: [
        "Kunne overføre teoretisk viden til praktisk handlen.",
        "Dokumentere socialfagligt arbejde professionelt.",
        "Indgå i konstruktivt samarbejde med kolleger og eksterne partnere."
    ]
  },
  7: {
    semester: 7,
    title: "Bachelorprojekt",
    focus: "Selvvalgt videnskabeligt arbejde og forberedelse til arbejdslivet.",
    concepts: [
      { name: "Videnskabsteori", description: "Grundlaget for hvordan vi skaber valid viden (f.eks. hermeneutik, positivisme)." },
      { name: "Problemformulering", description: "Kernen i projektet der styrer hele undersøgelsen." },
      { name: "Metodetriangulering", description: "Brug af flere metoder til at belyse samme fænomen." }
    ],
    models: [
      { name: "Den videnskabelige proces", description: "Fra undren til empiri, analyse og konklusion." },
      { name: "Toulmins argumentationsmodel", description: "Værktøj til at opbygge de stærkeste argumenter i din analyse." }
    ],
    examTips: [
      "Vær knivskarp på din røde tråd gennem hele opgaven.",
      "Sørg for at din videnskabsteori gennemsyrer dine metodiske valg.",
      "Forbered dig på at forsvare dine fravalg til den mundtlige eksamen."
    ],
    learningGoals: [
      "Gennemføre en selvstændig socialfaglig undersøgelse.",
      "Formidle kompleks viden til forskellige modtagere.",
      "Demonstrere parathed til at indtræde i professionen."
    ]
  }
};
