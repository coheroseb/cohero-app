
import { LawReference, LawSituation } from './types';

export const LAW_REGISTRY: LawReference[] = [
    {
        id: 'barnets-lov',
        name: 'Barnets Lov',
        abbreviation: 'BL',
        category: 'børn-unge',
        description: 'Gælder støtte til børn og unge under 18 år. Erstatter mange af de tidligere børnebestemmelser i serviceloven.',
        xmlUrl: 'https://www.retsinformation.dk/eli/lta/2023/164',
        lbk: 'LBK nr 164 af 25/02/2023',
        keywords: ["underretningspligt", "underretning", "anbringelse", "støtte til børn", "plejefamilie", "børnefaglig undersøgelse", "§ 50", "efterværn", "samvær"],
        importance: 10
    },
    {
        id: 'serviceloven',
        name: 'Lov om social service',
        abbreviation: 'SEL',
        category: 'voksne',
        description: 'Rammelov for social service til voksne, ældre og personer med handicap. Dækker også visse emner for børn indtil 2024.',
        xmlUrl: 'https://www.retsinformation.dk/eli/lta/2023/170',
        lbk: 'LBK nr 170 af 24/02/2023',
        keywords: ["merudgifter", "hjælpemidler", "botilbud", "ledsageordning", "hjemmehjælp", "socialpædagogisk bistand", "§ 85", "§ 107", "voksne"],
        importance: 10
    },
    {
        id: 'forvaltningsloven',
        name: 'Forvaltningsloven',
        abbreviation: 'FVL',
        category: 'forvaltning',
        description: 'Generelle regler for behandling af sager i den offentlige forvaltning. Sikrer borgernes retssikkerhed i processen.',
        xmlUrl: 'https://www.retsinformation.dk/eli/lta/2022/433',
        lbk: 'LBK nr 433 af 22/04/2014',
        keywords: ["partshøring", "aktindsigt", "tavshedspligt", "begrundelse", "vejledningspligt", "habilitet", "klagevejledning"],
        importance: 9
    },
    {
        id: 'retssikkerhedsloven',
        name: 'Retssikkerhedsloven',
        abbreviation: 'RSL',
        category: 'forvaltning',
        description: 'Regler om hvordan sociale sager skal behandles og borgernes rettigheder i socialsystemet.',
        keywords: ["sagsoplysning", "officialprincippet", "hurtighedsprincippet", "helhedsvurdering", "frister", "borgerinddragelse"],
        importance: 9
    },
    {
        id: 'sundhedsloven',
        name: 'Sundhedsloven',
        abbreviation: 'SUL',
        category: 'sundhed',
        description: 'Regler for det danske sundhedsvæsen, patienters rettigheder og behandling.',
        keywords: ["patientrettigheder", "samtykke til behandling", "journalindsigt", "tavshedspligt i sundhedsvæsenet", "genoptræning"],
        importance: 7
    },
    {
        id: 'aktivloven',
        name: 'Lov om aktiv socialpolitik',
        abbreviation: 'LAS',
        category: 'økonomi',
        description: 'Regler for kontanthjælp, uddannelseshjælp og andre økonomiske ydelser.',
        keywords: ["kontanthjælp", "uddannelseshjælp", "rådighed", "sanktioner", "forsørgelse"],
        importance: 8
    },
    {
        id: 'lab-loven',
        name: 'Lov om en aktiv beskæftigelsesindsats',
        abbreviation: 'LAB',
        category: 'arbejdsmarked',
        description: 'Regler for indsatsen over for ledige, herunder fleksjob og ressourceforløb.',
        keywords: ["fleksjob", "ressourceforløb", "jobafklaring", "virksomhedspraktik", "løntilskud"],
        importance: 8
    }
];

export const SITUATIONS_REGISTRY: LawSituation[] = [
    {
        id: 'barn-mistrives',
        title: 'Barn mistrives',
        description: 'Mistanke om omsorgssvigt eller overgreb.',
        icon: 'AlertTriangle',
        color: 'bg-rose-50 text-rose-700',
        relevantLawIds: ['barnets-lov', 'forvaltningsloven']
    },
    {
        id: 'sagsbehandling',
        title: 'Sagsbehandling',
        description: 'Vejledning, partshøring og afgørelser.',
        icon: 'Scale',
        color: 'bg-blue-50 text-blue-700',
        relevantLawIds: ['forvaltningsloven', 'retssikkerhedsloven']
    },
    {
        id: 'voksen-stotte',
        title: 'Voksen-støtte',
        description: 'Bistand til voksne med nedsat funktionsevne.',
        icon: 'Stethoscope',
        color: 'bg-emerald-50 text-emerald-700',
        relevantLawIds: ['serviceloven', 'sundhedsloven']
    }
];
